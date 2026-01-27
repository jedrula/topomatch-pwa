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
      path: '/admin/diagnostics',
      name: 'admin-diagnostics',
      component: () => import('../views/AdminDiagnosticsView.vue'),
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

// Route guard to protect authenticated and admin routes
router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore();

  // Wait for auth to initialize
  await userStore.initAuth();

  // Check if route requires authentication
  if (to.meta.requiresAuth && !userStore.user) {
    next('/');
    return;
  }

  // Check if route requires admin
  if (to.meta.requiresAdmin && !userStore.canEditLocations) {
    next('/');
    return;
  }

  next();
});

router.afterEach((to, from) => {
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
