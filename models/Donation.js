/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Donation', {
    donation_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    donor_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'Donor',
        key: 'donor_id'
      }
    },
    amount: {
      type: DataTypes.DECIMAL,
      allowNull: true
    },
    date: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'Donation'
  });
};
