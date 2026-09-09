/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import React from 'react';

const AIScenarioAnalysis = React.lazy(() => import('./pages/AIScenarioAnalysis'));
const Checklists = React.lazy(() => import('./pages/Checklists'));
const CropManagement = React.lazy(() => import('./pages/CropManagement'));
const DairyProduction = React.lazy(() => import('./pages/DairyProduction'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const EmergencyLogs = React.lazy(() => import('./pages/EmergencyLogs'));
const EquipmentManagement = React.lazy(() => import('./pages/EquipmentManagement'));
const FarmGoals = React.lazy(() => import('./pages/FarmGoals'));
const FarmHistory = React.lazy(() => import('./pages/FarmHistory'));
const FarmPlanDashboard = React.lazy(() => import('./pages/FarmPlanDashboard'));
const FarmProfile = React.lazy(() => import('./pages/FarmProfile'));
const FarmStand = React.lazy(() => import('./pages/FarmStand'));
const FermentationDetail = React.lazy(() => import('./pages/FermentationDetail'));
const FermentationTracking = React.lazy(() => import('./pages/FermentationTracking'));
const FinancialManagement = React.lazy(() => import('./pages/FinancialManagement'));
const FinancialPlanning = React.lazy(() => import('./pages/FinancialPlanning'));
const FinancialReports = React.lazy(() => import('./pages/FinancialReports'));
const Forum = React.lazy(() => import('./pages/Forum'));
const ForumPost = React.lazy(() => import('./pages/ForumPost'));
const GuideDetail = React.lazy(() => import('./pages/GuideDetail'));
const Guides = React.lazy(() => import('./pages/Guides'));
const Home = React.lazy(() => import('./pages/Home'));
const InventoryManagement = React.lazy(() => import('./pages/InventoryManagement'));
const LivestockDetail = React.lazy(() => import('./pages/LivestockDetail'));
const LivestockManagement = React.lazy(() => import('./pages/LivestockManagement'));
const MaintenancePlanning = React.lazy(() => import('./pages/MaintenancePlanning'));
const ManageMarketplace = React.lazy(() => import('./pages/ManageMarketplace'));
const MarketingPlanning = React.lazy(() => import('./pages/MarketingPlanning'));
const MyTasks = React.lazy(() => import('./pages/MyTasks'));
const OrchardManagement = React.lazy(() => import('./pages/OrchardManagement'));
const Pricing = React.lazy(() => import('./pages/Pricing'));
const PropertyMap = React.lazy(() => import('./pages/PropertyMap'));
const ReferralProgram = React.lazy(() => import('./pages/ReferralProgram'));
const UserSettings = React.lazy(() => import('./pages/UserSettings'));
const WeatherDashboard = React.lazy(() => import('./pages/WeatherDashboard'));
const WhatToPlantNow = React.lazy(() => import('./pages/WhatToPlantNow'));
import __Layout from './Layout.jsx';


export const PAGES = {
    "AIScenarioAnalysis": AIScenarioAnalysis,
    "Checklists": Checklists,
    "CropManagement": CropManagement,
    "DairyProduction": DairyProduction,
    "Dashboard": Dashboard,
    "EmergencyLogs": EmergencyLogs,
    "EquipmentManagement": EquipmentManagement,
    "FarmGoals": FarmGoals,
    "FarmHistory": FarmHistory,
    "FarmPlanDashboard": FarmPlanDashboard,
    "FarmProfile": FarmProfile,
    "FarmStand": FarmStand,
    "FermentationDetail": FermentationDetail,
    "FermentationTracking": FermentationTracking,
    "FinancialManagement": FinancialManagement,
    "FinancialPlanning": FinancialPlanning,
    "FinancialReports": FinancialReports,
    "Forum": Forum,
    "ForumPost": ForumPost,
    "GuideDetail": GuideDetail,
    "Guides": Guides,
    "Home": Home,
    "InventoryManagement": InventoryManagement,
    "LivestockDetail": LivestockDetail,
    "LivestockManagement": LivestockManagement,
    "MaintenancePlanning": MaintenancePlanning,
    "ManageMarketplace": ManageMarketplace,
    "MarketingPlanning": MarketingPlanning,
    "MyTasks": MyTasks,
    "OrchardManagement": OrchardManagement,
    "Pricing": Pricing,
    "PropertyMap": PropertyMap,
    "ReferralProgram": ReferralProgram,
    "UserSettings": UserSettings,
    "WeatherDashboard": WeatherDashboard,
    "WhatToPlantNow": WhatToPlantNow,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};