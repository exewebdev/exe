/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Member', {
    member_id: {
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
    },
    email_hash: {
      type: DataTypes.STRING,
      allowNull: true
    },
    major: {
      type: DataTypes.STRING,
      allowNull: true
    },
    class: {
      type: DataTypes.STRING,
      allowNull: true
    },
    grad_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    tshirt_size: {
      type: DataTypes.STRING,
      allowNull: true
    },
    paid: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: '0'
    },
    post_count: {
      type: DataTypes.BIGINT,
      allowNull: true,
      defaultValue: '0'
    },
    points: {
      type: DataTypes.BIGINT,
      allowNull: true,
      defaultValue: '0'
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    facebook_id: {
      type: DataTypes.STRING,
      allowNull: true
    },
    facebook_token: {
      type: DataTypes.STRING,
      allowNull: true
    },
    subscribe: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: '0'
    },
    privs: {
      type: DataTypes.BIGINT,
      allowNull: true,
      defaultValue: '0'
    }
  }, {
    timestamps: false,
    tableName: 'Member'
  });
};
