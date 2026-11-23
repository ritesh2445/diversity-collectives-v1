import { onRequest as __api___path___js_onRequest } from "C:\\DCVC-1\\diversity-collectives-v1\\functions\\api\\[[path]].js"

export const routes = [
    {
      routePath: "/api/:path*",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api___path___js_onRequest],
    },
  ]