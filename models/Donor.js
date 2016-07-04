/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Donor', {
    donor_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    fname: {
      type: DataTypes.STRING,
      allowNull: true
    },
    mi: {
      type: DataTypes.STRING,
      allowNull: true
    },
    lname: {
      type: DataTypes.STRING,
      allowNull: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    tableName: 'Donor'
  });
};
