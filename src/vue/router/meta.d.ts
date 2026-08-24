import 'vue-router'
import type { Permission } from '@/lib/accountDirectory'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    admin?: boolean
    permission?: Permission
  }
}
