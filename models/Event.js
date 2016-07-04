/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Event', {
    event_id: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true
    },
    points: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    event_id_remote: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    tableName: 'Event'
  });
};
