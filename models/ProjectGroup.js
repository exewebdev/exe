/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('ProjectGroup', {
    proj_group_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    club_name: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'Club',
        key: 'club_name'
      }
    },
    proj_lead_id: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    building: {
      type: DataTypes.STRING,
      allowNull: true
    },
    room: {
      type: DataTypes.STRING,
      allowNull: true
    },
    datetime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    timestamps: false,
    tableName: 'ProjectGroup'
  });
};
