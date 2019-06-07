module.exports = (sequelize, DataTypes) => {
  const Dispatchers = sequelize.import('./Dispatchers')
  const Packages = sequelize.import('./Packages')
  const DispatchPairs = sequelize.define('DispatchPairs', {
    rate: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 3,
      validate: {
        min: 0,
        max: 5
      }
    }
  })
  DispatchPairs.belongsTo(Dispatchers, {
    foreignKey: 'uuid',
    targetKey: 'uuid',
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT'
  })
  DispatchPairs.belongsTo(Packages, {
    foreignKey: 'package_id',
    targetKey: 'package_id',
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL'
  })
  DispatchPairs.afterUpdate(async (dispatchPair, options) => {
    const dispatcher = {
      where: {
        uuid: dispatchPair.uuid
      }
    }
    const sum = await DispatchPairs.sum(dispatcher).then(sum => sum)
    const count = await DispatchPairs.count(dispatcher).then(count => count)
    console.log(sum)
    console.log(count)
    await Dispatchers.update({
      rate: sum / count
    }, dispatcher)
    console.log('ok')
  })
  return DispatchPairs
}
