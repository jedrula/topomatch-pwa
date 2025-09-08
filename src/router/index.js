import { createRouter, createWebHistory } from 'vue-router';
import BrowseLocationsView from '../views/BrowseLocationsView.vue';
import HoldDetectionServerView from '../views/HoldDetectionServerView.vue';
import AddLocationView from '../views/AddLocationView.vue';
import LocationDetailView from '../views/LocationDetailView.vue';
import EditLocationView from '../views/EditLocationView.vue';
import BoulderProblemDetailView from '../views/BoulderProblemDetailView.vue';
import AdminView from '../views/AdminView.vue';
import { useUserStore } from '../stores/userStore.js';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: BrowseLocationsView,
    },
    {
      path: '/add-location',
      name: 'add-location',
      component: AddLocationView,
      meta: { requiresAdmin: true },
    },
    {
      path: '/admin',
      name: 'admin',
      component: AdminView,
      meta: { requiresAdmin: true },
    },
    {
      path: '/browse-locations',
      redirect: '/', // Redirect old browse-locations route to root
    },
    {
      path: '/location/:locationId',
      name: 'location-detail',
      component: LocationDetailView,
      props: true,
    },
    {
      path: '/location/:locationId/edit',
      name: 'location-edit',
      component: EditLocationView,
      props: true,
      meta: { requiresAdmin: true },
    },
    {
      path: '/location/:locationId/holds-server',
      name: 'location-hold-detection-server',
      component: HoldDetectionServerView,
      props: true,
    },
    {
      path: '/location/:locationId/problem/:problemId',
      name: 'boulder-problem-detail',
      component: BoulderProblemDetailView,
      props: true,
    },
  ],
});

// Route guard to protect admin-only routes
router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore();

  // Wait for auth initialization to complete
  if (userStore.isLoading) {
    try {
      await userStore.initAuth();
    } catch (error) {
      console.error('Auth initialization failed:', error);
    }
  }

  // Check if route requires admin access
  if (to.meta.requiresAdmin && !userStore.canEditLocations) {
    // Redirect to home (locations) or show error
    console.warn('Access denied: Admin permissions required');
    next('/');
    return;
  }

  next();
});

export default router;
