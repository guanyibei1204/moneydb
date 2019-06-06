const express = require('express')
const router = express.Router()

const orm = require('../database/utils').orm()

const jwt_decode = require('express-jwt')
const {secretKey} = require('../router/salt')

const DispatchPairs = orm.import('../database/models/DispatchPairs')
const Packages = orm.import('../database/models/Packages')

router.post('/DispatchPair/Count', jwt_decode({
  secret: secretKey
}), (request, response) => {
  DispatchPairs.count().then(count => {
    response.json({
      count: count
    })
  })
})

const getCascadedLocation = require('../database/utils').getCascadedLocation
router.post('/DispatchPair/Query', jwt_decode({
  secret: secretKey
}), (request, response) => {
  const payload = request.body
  payload.include = [{
    model: Packages,
    attributes: [
      'package_id',
      'sender_name',
      'sender_phone',
      'receiver_name',
      'receiver_phone',
      'receiver_city',
      'receiver_address'
    ],
    where: {
      status: '派件中'
    }
  }]
  // if 是派送员
  //payload.where.uuid = request.user.uuid
  // 是管理员
  // 不加，查全部
  // else 直接 403
  DispatchPairs.findAll(payload)
    .then(async project => {
      for (const p of project){
        p.Package.receiver_city = await getCascadedLocation(p.Package.receiver_city)
      }
      response.json(project)
    })
})


router.post('/DispatchPair/Done', jwt_decode({
  secret: secretKey
}), (request, response) => {
  const payload = request.body
  console.log(request.user.uuid)
  console.log(payload)
  DispatchPairs.findOne({
    where: {
      package_id: payload.package_id,
      uuid: request.user.uuid
    },
    attributes: ['package_id']
  })
    .then(async project => {
      if (project != null) {
        console.log(project.get('package_id'))
        await Packages.update({
          status: '已签收',
          receive_date: Date.now()
        }, {
          where: {
            package_id: project.get('package_id')
          }
        })
          .then(() => {
            response.sendStatus(200)
          })
      } else {
        response.sendStatus(403)
      }
    })
})

module.exports = router