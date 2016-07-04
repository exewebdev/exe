/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Member_has_Event', {
    Member_member_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'Member',
        key: 'member_id'
      }
    },
    Event_event_id: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'Event',
        key: 'event_id'
      }
    }
  }, {
    tableName: 'Member_has_Event'
  });
};
