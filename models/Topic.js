/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Topic', {
    topic_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    forum_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'Forum',
        key: 'forum_id'
      }
    },
    topic_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    topic_description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    post_count: {
      type: DataTypes.BIGINT,
      allowNull: true,
      defaultValue: '0'
    }
  }, {
    timestamps: false,
    tableName: 'Topic'
  });
};
