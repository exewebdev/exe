/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Club', {
    club_name: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true
    },
    contact_email: {
      type: DataTypes.STRING,
      allowNull: true
    },
    building: {
      type: DataTypes.STRING,
      allowNull: true
    },
    room: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    tableName: 'Club'
  });
};
