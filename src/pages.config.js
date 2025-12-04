import Dashboard from './pages/Dashboard';
import Guides from './pages/Guides';
import GuideDetail from './pages/GuideDetail';
import Checklists from './pages/Checklists';
import Forum from './pages/Forum';
import ForumPost from './pages/ForumPost';
import Pricing from './pages/Pricing';
import LivestockManagement from './pages/LivestockManagement';
import FinancialManagement from './pages/FinancialManagement';
import FarmPlanDashboard from './pages/FarmPlanDashboard';
import FarmProfile from './pages/FarmProfile';
import FarmGoals from './pages/FarmGoals';
import FarmHistory from './pages/FarmHistory';
import MaintenancePlanning from './pages/MaintenancePlanning';
import FinancialPlanning from './pages/FinancialPlanning';
import CropManagement from './pages/CropManagement';
import MarketingPlanning from './pages/MarketingPlanning';
import FinancialReports from './pages/FinancialReports';
import LivestockDetail from './pages/LivestockDetail';
import FermentationTracking from './pages/FermentationTracking';
import FermentationDetail from './pages/FermentationDetail';
import PropertyMap from './pages/PropertyMap';
import OrchardManagement from './pages/OrchardManagement';
import WeatherDashboard from './pages/WeatherDashboard';
import InventoryManagement from './pages/InventoryManagement';
import EquipmentManagement from './pages/EquipmentManagement';
import UserSettings from './pages/UserSettings';
import ReferralProgram from './pages/ReferralProgram';
import DairyProduction from './pages/DairyProduction';
import AIScenarioAnalysis from './pages/AIScenarioAnalysis';
import MyTasks from './pages/MyTasks';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Guides": Guides,
    "GuideDetail": GuideDetail,
    "Checklists": Checklists,
    "Forum": Forum,
    "ForumPost": ForumPost,
    "Pricing": Pricing,
    "LivestockManagement": LivestockManagement,
    "FinancialManagement": FinancialManagement,
    "FarmPlanDashboard": FarmPlanDashboard,
    "FarmProfile": FarmProfile,
    "FarmGoals": FarmGoals,
    "FarmHistory": FarmHistory,
    "MaintenancePlanning": MaintenancePlanning,
    "FinancialPlanning": FinancialPlanning,
    "CropManagement": CropManagement,
    "MarketingPlanning": MarketingPlanning,
    "FinancialReports": FinancialReports,
    "LivestockDetail": LivestockDetail,
    "FermentationTracking": FermentationTracking,
    "FermentationDetail": FermentationDetail,
    "PropertyMap": PropertyMap,
    "OrchardManagement": OrchardManagement,
    "WeatherDashboard": WeatherDashboard,
    "InventoryManagement": InventoryManagement,
    "EquipmentManagement": EquipmentManagement,
    "UserSettings": UserSettings,
    "ReferralProgram": ReferralProgram,
    "DairyProduction": DairyProduction,
    "AIScenarioAnalysis": AIScenarioAnalysis,
    "MyTasks": MyTasks,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};