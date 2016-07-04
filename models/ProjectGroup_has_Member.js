/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('ProjectGroup_has_Member', {
    ProjectGroup_proj_group_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'ProjectGroup',
        key: 'proj_group_id'
      }
    },
    Member_member_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'Member',
        key: 'member_id'
      }
    }
  }, {
    tableName: 'ProjectGroup_has_Member'
  });
};
