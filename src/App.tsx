import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import RequireAuth from '@/components/RequireAuth'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import AppLayout from '@/pages/AppLayout'
import Dashboard from '@/pages/Dashboard'
import CommandCenter from '@/pages/CommandCenter'
import WorkspaceList from '@/pages/WorkspaceList'
import WorkspaceDetail from '@/pages/WorkspaceDetail'
import AgentControlCenter from '@/pages/AgentControlCenter'
import AgentTemplateDetail from '@/pages/AgentTemplateDetail'
import WorkspaceAgentDetail from '@/pages/WorkspaceAgentDetail'
import SkillLibrary from '@/pages/SkillLibrary'
import SkillDetail from '@/pages/SkillDetail'
import WorkflowBuilder from '@/pages/WorkflowBuilder'
import WorkflowDetail from '@/pages/WorkflowDetail'
import ExecutionCenter from '@/pages/ExecutionCenter'
import WorkflowRunDetail from '@/pages/WorkflowRunDetail'
import ReviewCenter from '@/pages/ReviewCenter'
import ReviewDetail from '@/pages/ReviewDetail'
import Settings from '@/pages/Settings'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/app"
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="command" element={<CommandCenter />} />
          <Route path="workspaces" element={<WorkspaceList />} />
          <Route path="workspaces/:workspaceId" element={<WorkspaceDetail />} />
          <Route path="agents" element={<AgentControlCenter />} />
          <Route path="agents/templates/:templateId" element={<AgentTemplateDetail />} />
          <Route path="agents/instances/:agentId" element={<WorkspaceAgentDetail />} />
          <Route path="skills" element={<SkillLibrary />} />
          <Route path="skills/:skillId" element={<SkillDetail />} />
          <Route path="workflows" element={<WorkflowBuilder />} />
          <Route path="workflows/:workflowId" element={<WorkflowDetail />} />
          <Route path="execution" element={<ExecutionCenter />} />
          <Route path="execution/runs/:runId" element={<WorkflowRunDetail />} />
          <Route path="reviews" element={<ReviewCenter />} />
          <Route path="reviews/:reviewId" element={<ReviewDetail />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="/" element={<Navigate to="/app/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
      </Routes>
    </Router>
  )
}
