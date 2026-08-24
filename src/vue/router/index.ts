import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'
import {
  canAccessAdmin,
  getDirectory,
  getSessionAccount,
  hasDirectoryPermission,
  type Permission,
} from '@/lib/accountDirectory'

const protectedRoute = (permission?: Permission, admin = false) => ({ requiresAuth: true, permission, admin })

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/home' },
  { path: '/login', name: 'login', component: () => import('../views/LoginView.vue') },
  { path: '/home', name: 'home', component: () => import('../views/HomeView.vue') },
  { path: '/explore', name: 'explore', component: () => import('../views/ExploreView.vue') },
  { path: '/model/:id', name: 'model-detail', component: () => import('../views/ModelDetailView.vue') },
  { path: '/cases', name: 'case-library-public', component: () => import('../views/PublicCaseLibraryView.vue') },
  { path: '/cases/:caseId', name: 'case-detail', component: () => import('../views/CaseDetailView.vue') },
  { path: '/datasets', name: 'datasets', component: () => import('../views/DatasetsView.vue') },
  { path: '/about', name: 'about', component: () => import('../views/AboutView.vue') },
  { path: '/user-center', name: 'user-center', component: () => import('../views/UserCenterView.vue'), meta: protectedRoute() },
  { path: '/admin', name: 'admin', component: () => import('../views/AdminView.vue'), meta: protectedRoute(undefined, true) },
  { path: '/workbench', redirect: '/workbench/tasks' },
  { path: '/workbench/run/:taskId', name: 'workbench-run', component: () => import('../views/WorkbenchRunView.vue'), meta: protectedRoute('analysis:manage') },
  { path: '/workbench/wsi', name: 'workbench-wsi', component: () => import('../views/WsiManagementView.vue'), meta: protectedRoute('wsi:manage') },
  { path: '/workbench/cases', name: 'workbench-cases', component: () => import('../views/CaseManagementView.vue'), meta: protectedRoute('cases:manage') },
  { path: '/workbench/projects', name: 'workbench-projects', component: () => import('../views/ProjectManagementView.vue'), meta: protectedRoute('projects:manage') },
  { path: '/workbench/models', name: 'workbench-models', component: () => import('../views/ModelManagementView.vue'), meta: protectedRoute('workbench-models:manage') },
  { path: '/workbench/tasks', name: 'workbench-tasks', component: () => import('../views/TaskQueueView.vue'), meta: protectedRoute('analysis:manage') },
  { path: '/workbench/tasks/new', name: 'workbench-task-new', component: () => import('../views/CreateTaskView.vue'), meta: protectedRoute('analysis:manage') },
  { path: '/workbench/tasks/:taskId', name: 'workbench-task-detail', redirect: (to) => `/workbench/run/${String(to.params.taskId)}`, meta: protectedRoute('analysis:manage') },
  { path: '/:pathMatch(.*)*', redirect: '/home' },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach((to) => {
  if (!to.meta.requiresAuth) return true

  const session = getSessionAccount(getDirectory())
  if (!session) {
    return { name: 'login', query: { redirect: to.fullPath }, replace: true }
  }

  if (to.meta.admin && !canAccessAdmin(session)) return { name: 'user-center', replace: true }
  if (to.meta.permission && !hasDirectoryPermission(session, to.meta.permission as Permission)) {
    return { name: 'user-center', replace: true }
  }

  return true
})

export default router
