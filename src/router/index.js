alert('xww - router loading');
import { createRouter, createWebHistory } from 'vue-router';
// Only import the home view statically for fastest initial load
import BrowseLocationsView from '../views/BrowseLocationsView.vue';
// All other views use lazy loading (route-level code splitting)
import { useUserStore } from '../stores/userStore.js';
alert('xww - all imports loaded');
console.log('[router] Creating router with BASE_URL:', import.meta.env.BASE_URL);

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
      path: '/push-test',
      name: 'push-test',
      component: () => import('../views/PushNotificationTestView.vue'),
      meta: { requiresAdmin: true },
    },
    {
      path: '/browse-locations',
      redirect: '/', // Redirect old browse-locations route to root
    },
    {
      path: '/pick-location',
      name: 'pick-location',
      component: () => import('../views/LocationPickerView.vue'),
    },
    {
      path: '/location/:locationId',
      name: 'location-detail',
      component: () => import('../views/LocationDetailView.vue'),
      props: true,
    },
    {
      path: '/location/:locationId/routesettings',
      name: 'location-routesettings',
      component: () => import('../views/LocationRoutesettingsView.vue'),
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
  console.log('[router] beforeEach: navigating to', to.path, 'from', from.path);
  const userStore = useUserStore();

  // In Capacitor, don't wait for auth on initial navigation - let routes load
  // Auth will initialize separately via App.vue's onMounted
  // Only enforce admin check if auth is already loaded
  if (!userStore.isLoading && to.meta.requiresAdmin && !userStore.canEditLocations) {
    console.warn('[router] Access denied: Admin permissions required');
    next('/');
    return;
  }

  console.log('[router] Allowing navigation to', to.path);
  next();
});

// Debug: Log all route changes
router.afterEach((to, from) => {
  console.log('[router] Navigated to:', to.path, 'from:', from.path);
  
  // Scroll the main content container to top on route change
  const appContent = document.querySelector('.app-content');
  if (appContent) {
    appContent.scrollTop = 0;
  }
});

// Handle chunk loading errors (e.g., after deployment when cached files reference old chunks)
router.onError((error) => {
  console.error('[router] Error:', error);
  if (/Failed to fetch dynamically imported module|Importing a module script failed/.test(error.message)) {
    console.warn('Chunk loading failed, reloading page:', error);
    // Force reload to clear cached chunks
    window.location.href = window.location.href;
  }
});

export default router;
