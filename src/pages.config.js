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
import AIScenarioAnalysis from './pages/AIScenarioAnalysis';
import Checklists from './pages/Checklists';
import CropManagement from './pages/CropManagement';
import DairyProduction from './pages/DairyProduction';
import Dashboard from './pages/Dashboard';
import EquipmentManagement from './pages/EquipmentManagement';
import FarmGoals from './pages/FarmGoals';
import FarmHistory from './pages/FarmHistory';
import FarmPlanDashboard from './pages/FarmPlanDashboard';
import FarmProfile from './pages/FarmProfile';
import FermentationDetail from './pages/FermentationDetail';
import FermentationTracking from './pages/FermentationTracking';
import FinancialManagement from './pages/FinancialManagement';
import FinancialPlanning from './pages/FinancialPlanning';
import FinancialReports from './pages/FinancialReports';
import Forum from './pages/Forum';
import ForumPost from './pages/ForumPost';
import GuideDetail from './pages/GuideDetail';
import Guides from './pages/Guides';
import Home from './pages/Home';
import InventoryManagement from './pages/InventoryManagement';
import LivestockDetail from './pages/LivestockDetail';
import LivestockManagement from './pages/LivestockManagement';
import MaintenancePlanning from './pages/MaintenancePlanning';
import MarketingPlanning from './pages/MarketingPlanning';
import MyTasks from './pages/MyTasks';
import OrchardManagement from './pages/OrchardManagement';
import Pricing from './pages/Pricing';
import PropertyMap from './pages/PropertyMap';
import ReferralProgram from './pages/ReferralProgram';
import UserSettings from './pages/UserSettings';
import WeatherDashboard from './pages/WeatherDashboard';
import FarmStand from './pages/FarmStand';
import EmergencyLogs from './pages/EmergencyLogs';
import ManageMarketplace from './pages/ManageMarketplace';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AIScenarioAnalysis": AIScenarioAnalysis,
    "Checklists": Checklists,
    "CropManagement": CropManagement,
    "DairyProduction": DairyProduction,
    "Dashboard": Dashboard,
    "EquipmentManagement": EquipmentManagement,
    "FarmGoals": FarmGoals,
    "FarmHistory": FarmHistory,
    "FarmPlanDashboard": FarmPlanDashboard,
    "FarmProfile": FarmProfile,
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
    "MarketingPlanning": MarketingPlanning,
    "MyTasks": MyTasks,
    "OrchardManagement": OrchardManagement,
    "Pricing": Pricing,
    "PropertyMap": PropertyMap,
    "ReferralProgram": ReferralProgram,
    "UserSettings": UserSettings,
    "WeatherDashboard": WeatherDashboard,
    "FarmStand": FarmStand,
    "EmergencyLogs": EmergencyLogs,
    "ManageMarketplace": ManageMarketplace,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};