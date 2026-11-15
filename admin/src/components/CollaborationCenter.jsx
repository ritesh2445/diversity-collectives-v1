import React, { useState, useEffect } from 'react';
import { 
  Users, 
  CheckSquare, 
  Clock, 
  MessageSquare, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  Plus, 
  Trash2, 
  ArrowRight, 
  Activity, 
  UserCheck, 
  Calendar,
  Sparkles,
  Shield,
  Layers,
  Send
} from 'lucide-react';
import { 
  getKanbanTasks, 
  saveKanbanTask, 
  updateTaskColumn, 
  deleteTask,
  getPendingApprovalsQueue, 
  getRecordComments, 
  addRecordComment, 
  getActiveStaffPresence,
  getStoredUser
} from '../services/adminClient.js';

export default function CollaborationCenter({ onTriggerFeedback }) {
  const [subTab, setSubTab] = useState('kanban'); // 'kanban' | 'approvals' | 'comments' | 'presence'

  // Kanban Tasks
  const [tasks, setTasks] = useState([]);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('Tess Allen');
  const [newTaskPriority, setNewTaskPriority] = useState('medium');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskNotes, setNewTaskNotes] = useState('');

  // Approvals Queue
  const [approvals, setApprovals] = useState([]);

  // Comments
  const [selectedRecordId, setSelectedRecordId] = useState('biz-1');
  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState('');

  // Live Presence
  const [presence, setPresence] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [t, a, c, p] = await Promise.all([
      getKanbanTasks(),
      getPendingApprovalsQueue(),
      getRecordComments('business', selectedRecordId),
      getActiveStaffPresence()
    ]);
    setTasks(t);
    setApprovals(a);
    setComments(c);
    setPresence(p);
  };

  const handleMoveTask = async (taskId, newCol) => {
    const res = await updateTaskColumn(taskId, newCol);
    setTasks(res.tasks);
    onTriggerFeedback?.(`Task moved to ${newCol.replace('_', ' ')}.`);
  };

  const handleSaveTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    await saveKanbanTask({
      title: newTaskTitle,
      assignee: newTaskAssignee,
      priority: newTaskPriority,
      dueDate: newTaskDueDate || '2026-03-10',
      notes: newTaskNotes,
      column: 'todo'
    });
    const updated = await getKanbanTasks();
    setTasks(updated);
    setShowAddTaskModal(false);
    setNewTaskTitle('');
    setNewTaskNotes('');
    onTriggerFeedback?.('New collaborative task created.');
  };

  const handleDeleteTask = async (id) => {
    const res = await deleteTask(id);
    setTasks(res.tasks);
    onTriggerFeedback?.('Task deleted.');
  };

  const handleApprove = (id) => {
    setApprovals(prev => prev.filter(a => a.id !== id));
    onTriggerFeedback?.('Approval sign-off granted.');
  };

  const handleReject = (id) => {
    setApprovals(prev => prev.filter(a => a.id !== id));
    onTriggerFeedback?.('Request rejected.');
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    const res = await addRecordComment('business', selectedRecordId, newCommentText);
    setComments(res.comments);
    setNewCommentText('');
    onTriggerFeedback?.('Comment posted to record.');
  };

  const columns = [
    { id: 'todo', label: 'To Do', color: 'border-slate-300' },
    { id: 'in_progress', label: 'In Progress', color: 'border-purple-400' },
    { id: 'reviewed', label: 'Under Review', color: 'border-amber-400' },
    { id: 'done', label: 'Completed', color: 'border-emerald-400' }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-wider text-purple-700">
              PILLAR 6: COLLABORATION & WORKFLOW
            </span>
          </div>
          <h2 className="font-display text-2xl font-bold text-slate-950 mt-1 flex items-center gap-2">
            <Users className="w-6 h-6 text-[#5A1E65]" />
            <span>Team Collaboration & Governance</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Task Kanban boards, multi-party approval workflows, contextual record comments, and real-time editing presence.
          </p>
        </div>

        {/* Sub-Tabs */}
        <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
          {[
            { id: 'kanban', label: 'Task Board', icon: CheckSquare },
            { id: 'approvals', label: 'Approval Queue', icon: UserCheck },
            { id: 'comments', label: 'Record Discussions', icon: MessageSquare },
            { id: 'presence', label: 'Live Team Presence', icon: Activity }
          ].map(t => {
            const Icon = t.icon;
            const isActive = subTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setSubTab(t.id)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  isActive ? 'bg-[#5A1E65] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SUB-TAB 1: KANBAN TASK BOARD */}
      {subTab === 'kanban' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Active Workflow Tasks ({tasks.length})
            </span>
            <button
              onClick={() => setShowAddTaskModal(true)}
              className="px-4 py-2 rounded-xl bg-[#5A1E65] hover:bg-purple-900 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Task</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {columns.map(col => {
              const colTasks = tasks.filter(t => t.column === col.id);
              return (
                <div key={col.id} className="bg-slate-50/70 rounded-3xl p-4 border border-slate-200 flex flex-col justify-between min-h-[440px]">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full border-2 ${col.color}`} />
                        <span>{col.label}</span>
                      </span>
                      <span className="text-[11px] font-mono font-bold bg-white px-2 py-0.5 rounded-full border border-slate-200 text-slate-600">
                        {colTasks.length}
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {colTasks.map(task => (
                        <div key={task.id} className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-2 hover:border-purple-300 transition-all">
                          <div className="flex items-start justify-between">
                            <span className="font-bold text-xs text-slate-900 leading-snug">{task.title}</span>
                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              className="text-slate-300 hover:text-rose-600 p-0.5 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {task.notes && (
                            <p className="text-[11px] text-slate-500 leading-relaxed">{task.notes}</p>
                          )}

                          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px] font-mono">
                            <span className="text-slate-600 font-semibold">{task.assignee}</span>
                            <span className={`px-1.5 py-0.2 rounded font-bold uppercase ${
                              task.priority === 'high' ? 'bg-rose-100 text-rose-700' :
                              task.priority === 'medium' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {task.priority}
                            </span>
                          </div>

                          {/* Quick Move Row */}
                          <div className="flex items-center gap-1 pt-1 justify-end">
                            {col.id !== 'todo' && (
                              <button
                                onClick={() => handleMoveTask(task.id, 'todo')}
                                className="text-[9px] px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 cursor-pointer"
                              >
                                ← Todo
                              </button>
                            )}
                            {col.id !== 'in_progress' && (
                              <button
                                onClick={() => handleMoveTask(task.id, 'in_progress')}
                                className="text-[9px] px-1.5 py-0.5 bg-purple-50 hover:bg-purple-100 rounded text-purple-700 cursor-pointer font-bold"
                              >
                                In Prog
                              </button>
                            )}
                            {col.id !== 'done' && (
                              <button
                                onClick={() => handleMoveTask(task.id, 'done')}
                                className="text-[9px] px-1.5 py-0.5 bg-emerald-50 hover:bg-emerald-100 rounded text-emerald-700 cursor-pointer font-bold"
                              >
                                Done ✓
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add Task Modal */}
          {showAddTaskModal && (
            <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4">
                <h3 className="text-base font-bold text-slate-900">Create Workflow Task</h3>
                <form onSubmit={handleSaveTask} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Task Title</label>
                    <input
                      type="text"
                      required
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      placeholder="e.g. Verify Harbor Books Affirming Pledge"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#5A1E65] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Assignee</label>
                    <select
                      value={newTaskAssignee}
                      onChange={(e) => setNewTaskAssignee(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-semibold"
                    >
                      <option value="Tess Allen">Tess Allen (Executive Director)</option>
                      <option value="Marcus Cole">Marcus Cole (Programs Lead)</option>
                      <option value="Jordan Rivera">Jordan Rivera (Operations)</option>
                      <option value="Elena Diaz">Elena Diaz (Clinical SHINES)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Priority</label>
                    <select
                      value={newTaskPriority}
                      onChange={(e) => setNewTaskPriority(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-semibold"
                    >
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High / Urgent</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Notes / Instructions</label>
                    <textarea
                      rows={2}
                      value={newTaskNotes}
                      onChange={(e) => setNewTaskNotes(e.target.value)}
                      placeholder="Context for teammates..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#5A1E65] outline-none"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddTaskModal(false)}
                      className="px-4 py-2 rounded-xl text-slate-600 font-bold text-xs hover:bg-slate-100 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-[#5A1E65] text-white font-bold text-xs cursor-pointer shadow-xs"
                    >
                      Create Task
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: APPROVALS QUEUE */}
      {subTab === 'approvals' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-purple-700" />
              <span>Multi-Party Governance & Approval Workflows</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Review and sign-off on sensitive operational tasks: public business directory admissions, JIT role elevations, and high-value financial refunds.
            </p>
          </div>

          <div className="space-y-3">
            {approvals.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                <p className="text-sm font-semibold text-slate-700">All approval queues clear</p>
                <p className="text-xs text-slate-400 mt-1">No pending requests awaiting administrative sign-off.</p>
              </div>
            ) : (
              approvals.map(appr => (
                <div key={appr.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-purple-100 text-[#5A1E65] font-black px-2 py-0.5 rounded-full uppercase">
                        {appr.type}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900">{appr.title}</h4>
                    </div>
                    <p className="text-xs text-slate-600">{appr.details}</p>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Submitted by {appr.submittedBy} · {appr.submittedAt}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApprove(appr.id)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-xs"
                    >
                      Approve Sign-Off
                    </button>
                    <button
                      onClick={() => handleReject(appr.id)}
                      className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs cursor-pointer"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: RECORD COMMENTS & @MENTIONS */}
      {subTab === 'comments' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-purple-700" />
              <span>Record Discussions & Teammate @Mentions</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Keep conversations attached directly to business listings, donation records, or volunteer tickets instead of fragmented Slack threads.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-purple-50/60 p-3 rounded-2xl border border-purple-200">
              <span className="text-xs font-bold text-[#5A1E65]">Target Record:</span>
              <span className="text-xs font-bold text-slate-900 bg-white px-3 py-1 rounded-xl border border-purple-200">
                Harbor Books & Community Corner (biz-1)
              </span>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {comments.map(c => (
                <div key={c.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <strong className="text-slate-900">{c.author}</strong>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(c.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-slate-700 leading-relaxed">{c.text}</p>
                </div>
              ))}
            </div>

            {/* Comment Form */}
            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder="Write a contextual note or @mention a teammate..."
                className="flex-1 px-4 py-2.5 rounded-2xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#5A1E65] outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-[#5A1E65] text-white font-bold text-xs rounded-2xl cursor-pointer hover:bg-purple-900 flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Post</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: REAL-TIME TEAM PRESENCE */}
      {subTab === 'presence' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-700" />
              <span>Real-Time Team Presence & Conflict Prevention</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live awareness of which staff members are actively reviewing or modifying specific modules, preventing accidental overwrites.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {presence.map(p => (
              <div key={p.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-[#5A1E65] text-white font-bold flex items-center justify-center text-sm shadow-xs">
                    {p.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                    p.status === 'online' ? 'bg-emerald-500' : 'bg-amber-400'
                  }`} />
                </div>
                <div>
                  <span className="font-bold text-sm text-slate-900 block">{p.name}</span>
                  <span className="text-[11px] text-purple-700 font-semibold block">{p.activeOn}</span>
                  <span className="text-[10px] text-slate-400 font-mono">Role: {p.role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
