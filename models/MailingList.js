/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('MailingList', {
    mail_list_id: {
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
    mail_list_name: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    tableName: 'MailingList'
  });
};
