
import React, { useState, useEffect, Suspense } from 'react';
import Layout from './components/Layout';
import TrackerPage from './components/pages/TrackerPage';
import IdeasPage from './components/pages/IdeasPage';
import RecipesPage from './components/pages/RecipesPage';
import LearnPage from './components/pages/LearnPage';
import ProfilePage from './components/pages/LogPage';
import ToddlerPickyEater from './components/pages/ToddlerPickyEater';
import BalanceDashboard from './components/pages/BalanceDashboard';
import NewbornPage from './components/pages/NewbornPage';
import ToddlerGrowthPage from './components/pages/ToddlerGrowthPage';

import FoodLogModal from './components/modals/FoodLogModal';
import HowToServeModal from './components/modals/HowToServeModal';
import RecipeModal from './components/modals/RecipeModal';
import ViewRecipeModal from './components/modals/ViewRecipeModal';
import AiImportModal from './components/modals/AiImportModal';
import AiSuggestModal from './components/modals/AiSuggestModal';
import ShoppingListModal from './components/modals/ShoppingListModal';
import SelectRecipeModal from './components/modals/SelectRecipeModal';
import SubstitutesModal from './components/modals/SubstitutesModal';
import DoctorReportModal from './components/modals/DoctorReportModal';
import FlavorPairingModal from './components/modals/FlavorPairingModal';
import AllergenAlertModal from './components/modals/AllergenAlertModal';
import BadgeUnlockedModal from './components/modals/BadgeUnlockedModal';
import CertificateModal from './components/modals/CertificateModal';
import CustomFoodModal from './components/modals/CustomFoodModal';
import LogMealModal from './components/modals/LogMealModal';
import TutorialModal from './components/modals/TutorialModal';
import AddChildModal from './components/modals/AddChildModal';
import { LiveSageModal } from './components/modals/LiveSageModal';

import { useAppMode } from './hooks/useAppMode';
import { useAppLogic } from './hooks/useAppLogic';
import { CustomFood } from './types';
import { flatFoodList } from './constants';
import Profile from './Profile';

const BarcodeScannerModal = React.lazy(() => import('./components/modals/BarcodeScannerModal'));

const App: React.FC = () => {
  const { state, actions } = useAppLogic();
  const { modalState } = state;
  const [currentPage, setCurrentPage] = useState('tracker');

  const { mode, config } = useAppMode(state.userProfile);

  // Sync current page with mode config if needed
  useEffect(() => {
    if (config && config.navItems.length > 0) {
        const itemExists = config.navItems.some(item => item.id === currentPage);
        if (!itemExists) setCurrentPage(config.navItems[0].id);
    }
  }, [mode, config]);

  const renderPage = () => {
      const baseColorName = config.themeColor.replace('bg-', '').replace('-600', '').replace('-500', '');
      switch (currentPage) {
          case 'tracker':
              return <TrackerPage triedFoods={state.activeTriedFoods} customFoods={state.customFoods} onFoodClick={(food) => actions.setModalState({ type: 'LOG_FOOD', food })} userProfile={state.userProfile} onShowGuide={(food) => actions.setModalState({ type: 'HOW_TO_SERVE', food, customDetails: (food as CustomFood).isCustom ? (food as CustomFood).details : undefined })} onAddCustomFood={(initialName) => actions.setModalState({ type: 'ADD_CUSTOM_FOOD', initialName })} onScanBarcode={mode === 'TODDLER' ? () => actions.setModalState({ type: 'SCAN_BARCODE' }) : undefined} baseColor={baseColorName} />;
          case 'recommendations':
              return <IdeasPage userProfile={state.userProfile} triedFoods={state.activeTriedFoods} onSaveProfile={actions.handleUpdateProfile} onFoodClick={(food) => actions.setModalState({ type: 'LOG_FOOD', food })} onShowSubstitutes={(food) => actions.setModalState({ type: 'SUBSTITUTES', food })} onShowFlavorPairing={() => actions.setModalState({ type: 'FLAVOR_PAIRING' })} baseColor={baseColorName} />;
          case 'recipes':
              return <RecipesPage recipes={state.recipes} mealPlan={state.mealPlan} triedFoods={state.activeTriedFoods} customFoods={state.customFoods} savedStrategies={state.activeSavedStrategies} manualShoppingItems={state.manualShoppingItems} shoppingCheckedItems={state.shoppingCheckedItems} onShowAddRecipe={() => actions.setModalState({ type: 'ADD_RECIPE' })} onShowImportRecipe={() => actions.setModalState({ type: 'IMPORT_RECIPE' })} onShowSuggestRecipe={() => actions.setModalState({ type: 'SUGGEST_RECIPE' })} onViewRecipe={(recipe) => actions.setModalState({ type: 'VIEW_RECIPE', recipe })} onAddToPlan={(date, meal) => actions.setModalState({ type: 'SELECT_RECIPE', date, meal })} onRemoveFromPlan={actions.removeMealFromPlan} onShowShoppingList={() => actions.setModalState({ type: 'SHOPPING_LIST' })} onBatchLog={actions.handleBatchLogMeal} onUpdateBatchLog={actions.handleUpdateBatchLog} onCreateRecipe={actions.handleCreateRecipe} onEditRecipe={(recipe) => actions.setModalState({ type: 'ADD_RECIPE', recipeData: recipe })} onDeleteRecipe={actions.handleDeleteRecipe} onDeleteCustomFood={actions.handleDeleteCustomFood} onAddCustomFood={(initialName) => actions.setModalState({ type: 'ADD_CUSTOM_FOOD', initialName })} onScanBarcode={() => actions.setModalState({ type: 'SCAN_BARCODE' })} onAddManualShoppingItem={actions.handleAddManualItem} onToggleShoppingItem={actions.handleToggleShoppingItem} onClearCheckedShoppingItems={actions.handleClearCheckedItems} baseColor={baseColorName} appMode={mode} />;
          case 'learn':
              return <LearnPage mode={mode} baseColor={baseColorName} onStartLiveSage={() => actions.setModalState({ type: 'LIVE_SAGE' })} />;
          case 'profile':
              return (
                  <>
                      <Profile />
                      <ProfilePage userProfile={state.userProfile} triedFoods={state.activeTriedFoods} milestones={state.activeMilestones} onSaveProfile={actions.handleUpdateProfile} onResetData={actions.handleResetData} onShowDoctorReport={() => actions.setModalState({ type: 'DOCTOR_REPORT' })} onUpdateMilestone={actions.handleUpdateMilestone} onShowCertificate={() => actions.setModalState({ type: 'CERTIFICATE', babyName: state.userProfile?.babyName || 'Baby', date: new Date().toLocaleDateString() })} baseColor={baseColorName} />
                  </>
              );
          case 'feed':
          case 'health_check':
          case 'sleep_growth':
              return <NewbornPage currentPage={currentPage} feedLogs={state.feedLogs} diaperLogs={state.diaperLogs} sleepLogs={state.sleepLogs} medicineLogs={state.medicineLogs} growthLogs={state.growthLogs} onLogFeed={actions.handleLogFeed} onLogDiaper={actions.handleLogDiaper} onLogSleep={actions.handleLogSleep} onUpdateSleepLog={actions.handleUpdateSleepLog} onLogMedicine={actions.handleLogMedicine} onLogGrowth={actions.handleLogGrowth} onDeleteGrowth={actions.handleDeleteGrowth} baseColor={baseColorName} userProfile={state.userProfile} onUpdateProfile={actions.handleUpdateProfile} />;
          case 'picky_eater':
              return <ToddlerPickyEater baseColor={baseColorName} savedStrategies={state.activeSavedStrategies} onSaveStrategy={actions.handleSaveStrategy} onDeleteStrategy={actions.handleDeleteStrategy} safeFoods={state.userProfile?.safeFoods || []} onUpdateSafeFoods={actions.handleUpdateSafeFoods} />;
          case 'balance':
              return <BalanceDashboard triedFoods={state.activeTriedFoods} baseColor={baseColorName} />;
          case 'growth':
              return <ToddlerGrowthPage growthLogs={state.growthLogs} onLogGrowth={actions.handleLogGrowth} onDeleteGrowth={actions.handleDeleteGrowth} baseColor={baseColorName} userProfile={state.userProfile} />;
          default:
              return <TrackerPage triedFoods={state.activeTriedFoods} customFoods={state.customFoods} onFoodClick={(food) => actions.setModalState({ type: 'LOG_FOOD', food })} userProfile={state.userProfile} onShowGuide={(food) => actions.setModalState({ type: 'HOW_TO_SERVE', food, customDetails: (food as CustomFood).isCustom ? (food as CustomFood).details : undefined })} onAddCustomFood={(initialName) => actions.setModalState({ type: 'ADD_CUSTOM_FOOD', initialName })} onScanBarcode={mode === 'TODDLER' ? () => actions.setModalState({ type: 'SCAN_BARCODE' }) : undefined} baseColor={baseColorName} />;
      }
  };

  return (
    <Layout currentPage={currentPage} setCurrentPage={setCurrentPage} profile={state.userProfile} allProfiles={state.profiles} onSwitchProfile={actions.setActiveChildId} onAddProfile={() => actions.setModalState({ type: 'ADD_CHILD' })} progress={{ triedCount: new Set(state.activeTriedFoods.map(f => f.id)).size, totalCount: flatFoodList.length + state.customFoods.length }} mode={mode} config={config}>
      <Suspense fallback={<div className="p-4 text-center">Loading...</div>}>
        {renderPage()}
      </Suspense>

      {modalState.type === 'LOG_FOOD' && (
        <FoodLogModal food={modalState.food} existingLog={state.activeTriedFoods.find(f => f.id === modalState.food.name && f.date === new Date().toISOString().split('T')[0] && !f.meal)} onClose={() => actions.setModalState({ type: null })} onSave={actions.handleSaveFoodLog} onShowGuide={(food) => actions.setModalState({ type: 'HOW_TO_SERVE', food, returnToLog: true, customDetails: (food as CustomFood).isCustom ? (food as CustomFood).details : undefined })} onIncrementTry={actions.handleIncrementTry} baseColor={config.themeColor.replace('bg-', '').replace('-600', '').replace('-500', '')} appMode={mode} />
      )}

      {modalState.type === 'HOW_TO_SERVE' && <HowToServeModal food={modalState.food} onClose={() => { if (modalState.type === 'HOW_TO_SERVE' && modalState.returnToLog) actions.setModalState({ type: 'LOG_FOOD', food: modalState.food }); else actions.setModalState({ type: null }); }} />}
      {modalState.type === 'ADD_RECIPE' && <RecipeModal onClose={() => actions.setModalState({ type: null })} onSave={(data) => { if (modalState.type === 'ADD_RECIPE' && modalState.recipeData?.id) actions.handleUpdateRecipe(modalState.recipeData.id, data); else actions.handleCreateRecipe(data); actions.setModalState({ type: null }); }} initialData={modalState.recipeData} />}
      {modalState.type === 'VIEW_RECIPE' && <ViewRecipeModal recipe={modalState.recipe} onClose={() => actions.setModalState({ type: null })} onDelete={(id) => { actions.handleDeleteRecipe(id); actions.setModalState({ type: null }); }} onUpdateRating={(id, rating) => actions.handleUpdateRecipe(id, { rating })} />}
      {modalState.type === 'IMPORT_RECIPE' && <AiImportModal onClose={() => actions.setModalState({ type: null })} onRecipeParsed={(data) => actions.setModalState({ type: 'ADD_RECIPE', recipeData: data })} />}
      {modalState.type === 'SUGGEST_RECIPE' && <AiSuggestModal onClose={() => actions.setModalState({ type: null })} userProfile={state.userProfile} onRecipeParsed={(data) => actions.setModalState({ type: 'ADD_RECIPE', recipeData: data })} />}
      {modalState.type === 'SHOPPING_LIST' && <ShoppingListModal recipes={state.recipes} mealPlan={state.mealPlan} triedFoods={state.activeTriedFoods} manualItems={state.manualShoppingItems} checkedItems={state.shoppingCheckedItems} onAddManualItem={actions.handleAddManualItem} onToggleItem={actions.handleToggleShoppingItem} onClearChecked={actions.handleClearCheckedItems} onClose={() => actions.setModalState({ type: null })} />}
      {modalState.type === 'SELECT_RECIPE' && <SelectRecipeModal recipes={state.recipes} meal={modalState.meal} onClose={() => actions.setModalState({ type: null })} onSelect={(recipe) => actions.saveMealToPlan(modalState.date, modalState.meal, recipe.id, recipe.title)} />}
      {modalState.type === 'SUBSTITUTES' && <SubstitutesModal food={modalState.food} userProfile={state.userProfile} onClose={() => actions.setModalState({ type: null })} onSelectSubstitute={(food) => actions.setModalState({ type: 'LOG_FOOD', food })} />}
      {modalState.type === 'DOCTOR_REPORT' && <DoctorReportModal userProfile={state.userProfile} triedFoods={state.activeTriedFoods} onClose={() => actions.setModalState({ type: null })} />}
      {modalState.type === 'FLAVOR_PAIRING' && <FlavorPairingModal triedFoods={state.activeTriedFoods} onClose={() => actions.setModalState({ type: null })} />}
      {modalState.type === 'ALLERGEN_ALERT' && <AllergenAlertModal foodName={modalState.foodName} allergens={modalState.allergens} onClose={() => actions.setModalState({ type: null })} />}
      {modalState.type === 'BADGE_UNLOCKED' && <BadgeUnlockedModal badge={modalState.badge} onClose={() => actions.setModalState({ type: null })} />}
      {modalState.type === 'CERTIFICATE' && <CertificateModal babyName={modalState.babyName} date={modalState.date} onClose={() => actions.setModalState({ type: null })} />}
      {modalState.type === 'ADD_CUSTOM_FOOD' && <CustomFoodModal initialName={modalState.initialName} scannedData={modalState.scannedData} onClose={() => actions.setModalState({ type: null })} onSave={(newFood) => { actions.setCustomFoods(prev => [...prev, newFood]); actions.setModalState({ type: null }); }} />}
      {modalState.type === 'LOG_MEAL' && <LogMealModal recipes={state.recipes} onClose={() => actions.setModalState({ type: null })} onSave={actions.handleBatchLogMeal} onCreateRecipe={actions.handleCreateRecipe} baseColor={config.themeColor.replace('bg-', '').replace('-600', '').replace('-500', '')} initialFoods={modalState.initialFoods} customFoods={state.customFoods} enableScanner={mode === 'TODDLER'} onAddCustomFood={(initialName) => actions.setModalState({ type: 'ADD_CUSTOM_FOOD', initialName })} />}
      {modalState.type === 'SCAN_BARCODE' && <Suspense fallback={<div>Loading Scanner...</div>}><BarcodeScannerModal onClose={() => actions.setModalState({ type: null })} onScanSuccess={actions.handleBarcodeScan} /></Suspense>}
      {modalState.type === 'ADD_CHILD' && <AddChildModal onClose={() => actions.setModalState({ type: null })} onSave={actions.handleCreateChild} />}
      {modalState.type === 'LIVE_SAGE' && <LiveSageModal onClose={() => actions.setModalState({ type: null })} babyName={state.userProfile?.babyName} mode={mode} />}
      {state.isOnboarding && <TutorialModal onSave={(data) => { const newChild = { ...data, id: crypto.randomUUID() }; actions.handleCreateChild(newChild); }} onClose={() => actions.setIsOnboarding(false)} />}
    </Layout>
  );
};

export default App;
