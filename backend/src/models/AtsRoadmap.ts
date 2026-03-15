import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class AtsRoadmap extends Model {}

AtsRoadmap.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER, allowNull: true },
    jobRole: { type: DataTypes.STRING, allowNull: false },
    matchScore: { type: DataTypes.INTEGER, allowNull: true },
    missingSkills: { type: DataTypes.JSON, allowNull: true },
    roadmapData: { type: DataTypes.JSON, allowNull: false },
  },
  {
    sequelize,
    modelName: 'AtsRoadmap',
    tableName: 'ats_roadmaps',
    timestamps: true,
  }
);

export default AtsRoadmap;
