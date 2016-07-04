/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Officer', {
    officer_id: {
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
    member_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'Member',
        key: 'member_id'
      }
    },
    date_elected: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'Officer'
  });
};
