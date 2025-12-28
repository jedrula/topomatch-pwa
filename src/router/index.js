import { createRouter, createWebHistory } from 'vue-router';
// Only import the home view statically for fastest initial load
import BrowseLocationsView from '../views/BrowseLocationsView.vue';
// All other views use lazy loading (route-level code splitting)
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
      component: () => import('../views/AddLocationView.vue'),
      meta: { requiresAdmin: true },
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('../views/AdminView.vue'),
      meta: { requiresAdmin: true },
    },
    {
      path: '/browse-locations',
      redirect: '/', // Redirect old browse-locations route to root
    },
    {
      path: '/location/:locationId',
      name: 'location-detail',
      component: () => import('../views/LocationDetailView.vue'),
      props: true,
    },
    {
      path: '/location/:locationId/edit',
      name: 'location-edit',
      component: () => import('../views/EditLocationView.vue'),
      props: true,
      meta: { requiresAdmin: true },
    },
    {
      path: '/location/:locationId/holds-server',
      name: 'location-hold-detection-server',
      component: () => import('../views/HoldDetectionServerView.vue'),
      props: true,
    },
    {
      path: '/location/:locationId/jobs',
      name: 'location-jobs',
      component: () => import('../views/LocationJobsView.vue'),
      props: true,
    },
    {
      path: '/location/:locationId/problem/:problemId',
      name: 'boulder-problem-detail',
      component: () => import('../views/BoulderProblemDetailView.vue'),
      props: true,
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('../views/UserProfileView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/user/:userId',
      name: 'user-profile',
      component: () => import('../views/UserProfileView.vue'),
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

// Handle chunk loading errors (e.g., after deployment when cached files reference old chunks)
router.onError((error) => {
  if (/Failed to fetch dynamically imported module|Importing a module script failed/.test(error.message)) {
    console.warn('Chunk loading failed, reloading page:', error);
    // Force reload to clear cached chunks
    window.location.href = window.location.href;
  }
});

export default router;
