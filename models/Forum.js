/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Forum', {
    forum_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    forum_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    club_name: {
      type: DataTypes.STRING,
      allowNull: true,
      references: {
        model: 'Club',
        key: 'club_name'
      }
    }
  }, {
    timestamps: false,
    tableName: 'Forum'
  });
};
