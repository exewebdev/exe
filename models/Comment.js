/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Comment', {
    comment_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    thread_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'Thread',
        key: 'thread_id'
      }
    },
    member_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'Member',
        key: 'member_id'
      }
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    datetime: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    timestamps: false,
    tableName: 'Comment'
  });
};
