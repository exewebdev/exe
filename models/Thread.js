/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Thread', {
    thread_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    thread_name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    topic_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'Topic',
        key: 'topic_id'
      }
    },
    thread_op_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'Member',
        key: 'member_id'
      }
    },
    post_count: {
      type: DataTypes.BIGINT,
      allowNull: true,
      defaultValue: '0'
    }
  }, {
    timestamps: false,
    tableName: 'Thread'
  });
};
