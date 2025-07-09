import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import RegionView from "../views/RegionView.vue";
import HoldDetectionView from "../views/HoldDetectionView.vue";

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
  ],
});

export default router;
