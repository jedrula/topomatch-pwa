import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import RegionView from "../views/RegionView.vue";
import HoldDetectionView from "../views/HoldDetectionView.vue";
import AddLocationView from "../views/AddLocationView.vue";
import LocationDetailView from "../views/LocationDetailView.vue";
import EditLocationView from "../views/EditLocationView.vue";
import BrowseLocationsView from "../views/BrowseLocationsView.vue";
import { useUserStore } from "../stores/userStore.js";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: HomeView,
    },
    {
      path: "/:regionId",
      name: "region",
      component: RegionView,
      props: true,
    },
    {
      path: "/hold-detection",
      name: "hold-detection",
      component: HoldDetectionView,
    },
    {
      path: "/add-location",
      name: "add-location",
      component: AddLocationView,
      meta: { requiresAdmin: true },
    },
    {
      path: "/browse-locations",
      name: "browse-locations",
      component: BrowseLocationsView,
    },
    {
      path: "/location/:locationId",
      name: "location-detail",
      component: LocationDetailView,
      props: true,
    },
    {
      path: "/location/:locationId/edit",
      name: "location-edit",
      component: EditLocationView,
      props: true,
      meta: { requiresAdmin: true },
    },
  ],
});

// Route guard to protect admin-only routes
router.beforeEach((to, from, next) => {
  const userStore = useUserStore();

  // Check if route requires admin access
  if (to.meta.requiresAdmin && !userStore.canEditLocations) {
    // Redirect to browse locations or show error
    console.warn("Access denied: Admin permissions required");
    next("/browse-locations");
    return;
  }

  next();
});

export default router;
