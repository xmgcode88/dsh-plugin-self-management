// Client half of dsh-plugin-self-management.
//
// Three contributions, all root-scoped except the ambient strip:
//   1. a sidebar panel icon (`sidebar.panellist`) whose id addresses the
//      central panel registered under the same key in `main`;
//   2. a compact reminder strip under the composer (`conversation.composer.dock`)
//      so the daily reminder stays visible while chatting;
//   3. the management panel itself: weaknesses, learning directions and to-dos.
//
// Data is browser-local (localStorage), so the Host half stays empty. The
// panel offers JSON export/import because browser storage is per profile.
window.__ModuleLoader__.load({
  id: 'dsh-plugin-self-management',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const { useState, useEffect, useRef, useSyncExternalStore } = React
    const module = { exports: {} }
    const exports = module.exports

    const NS = 'self-management'
    const PANEL_ID = 'self-management'
    const STORAGE_KEY = 'dsh.self-management.v1'
    const DOCK_DISMISS_KEY = 'dsh.self-management.dock-dismissed'

    const zh = {
      'app.title': '自我管理',
      'app.subtitle': '缺点 · 学习方向 · 待办，随时提醒自己',
      'app.note': '数据保存在本机浏览器；建议定期导出备份。',
      'tab.today': '今日',
      'tab.weaknesses': '缺点',
      'tab.learning': '学习',
      'tab.todos': '待办',
      'today.greeting': '今天也要比昨天好一点',
      'today.reminder': '今日提醒',
      'today.rotate': '换一条',
      'today.record': '我做到了',
      'today.recorded': '已记录一次改进，继续保持。',
      'today.reviewPrefix': '已记录',
      'today.reviewSuffix': '次改进',
      'today.empty': '还没有记录缺点。先写下一条最想改掉的习惯吧。',
      'today.addWeakness': '添加缺点',
      'today.checkinDone': '今天已经提醒过自己',
      'today.checkinButton': '完成今日提醒',
      'today.streakSuffix': '天',
      'today.todosTitle': '今日待办',
      'today.todosEmpty': '今天没有必须完成的事，可以先推进学习方向。',
      'today.focusTitle': '学习焦点',
      'today.focusEmpty': '还没有学习方向，先定一个吧。',
      'today.openAll': '查看全部',
      'today.push': '推进 10%',
      'today.statOverdue': '逾期',
      'today.statDueToday': '今天到期',
      'today.statStreak': '连续提醒',
      'today.statActive': '待办未完成',
      'today.focusKicker': '现在最该做的一件事',
      'today.focusEmptyTitle': '从一件小事开始',
      'today.focusEmptySub': '写下一条缺点或一个待办，这张卡片会告诉你下一步做什么。',
      'today.focusActionTodo': '标记完成',
      'today.addTodo': '添加待办',
      'todo.overdueTag': '逾期',
      'todo.todayTag': '今天',
      'todo.importantTag': '重要',
      'weakness.title': '我的缺点',
      'weakness.desc': '写下它、看清它、给它一个可执行的动作。',
      'weakness.add': '添加缺点',
      'weakness.empty': '还没有记录。缺点不是用来自责的，是用来设计的。',
      'weakness.record': '记录一次改进',
      'severity.label': '严重程度',
      'weakness.coached': '已获指导',
      'weakness.noteLabel': '描述',
      'weakness.triggerLabel': '触发场景',
      'weakness.actionLabel': '改进动作',
      'weakness.reviewLabel': '最近改进',
      'weakness.confirmDelete': '确定删除这条缺点记录吗？',
      'learning.title': '学习方向',
      'learning.desc': '把「应该学」变成「正在学」。',
      'learning.add': '添加学习方向',
      'learning.empty': '还没有学习方向。写下一个正在推进的目标。',
      'learning.goalLabel': '目标',
      'learning.resourceLabel': '资源',
      'learning.noteLabel': '备注',
      'learning.progressLabel': '进度',
      'learning.doneLabel': '已完成',
      'learning.confirmDelete': '确定删除这个学习方向吗？',
      'todo.title': '待办',
      'todo.desc': '只放今天真正要推进的事。',
      'todo.add': '添加',
      'todo.placeholder': '要做什么？',
      'todo.empty': '还没有待办。',
      'todo.filterActive': '未完成',
      'todo.filterDone': '已完成',
      'todo.filterAll': '全部',
      'todo.duePrefix': '截止',
      'todo.priorityLabel': '优先级',
      'todo.confirmDelete': '确定删除这条待办吗？',
      'priority.high': '高',
      'priority.normal': '中',
      'priority.low': '低',
      'severity.high': '高',
      'severity.normal': '中',
      'severity.low': '低',
      'form.addWeakness': '添加缺点',
      'form.editWeakness': '编辑缺点',
      'form.addLearning': '添加学习方向',
      'form.editLearning': '编辑学习方向',
      'form.addTodo': '添加待办',
      'form.editTodo': '编辑待办',
      'form.titleLabel': '名称',
      'form.required': '请填写名称',
      'common.save': '保存',
      'common.cancel': '取消',
      'common.close': '关闭',
      'common.delete': '删除',
      'common.edit': '编辑',
      'common.export': '导出备份',
      'common.import': '导入备份',
      'common.reset': '清空数据',
      'common.resetConfirm': '将删除全部本地数据，确定继续吗？',
      'common.resetDone': '已清空本地数据。',
      'common.imported': '备份已导入。',
      'common.importFailed': '导入失败：文件格式不正确。',
      'common.importReadFailed': '导入失败：无法读取文件。',
      'common.importConfirm': '导入将覆盖当前数据，确定继续吗？',
      'common.exportFailed': '导出失败，请重试。',
      'common.saveFailed': '保存失败：浏览器存储不可用或已满。',
      'dock.reminder': '今日提醒',
      'dock.overduePrefix': '待办逾期',
      'dock.overdueSuffix': '项',
      'dock.open': '打开自我管理',
      'dock.dismiss': '关闭提醒',
      'dock.setup': '记录第一条缺点，开始自我管理',
      'dock.openShort': '打开',
      'toast.weaknessAdded': '已添加缺点。',
      'toast.learningAdded': '已添加学习方向。',
      'toast.todoAdded': '已添加待办。',
      'toast.saved': '已保存。',
      'toast.deleted': '已删除。',
      'toast.checkedIn': '今日提醒已完成。',
      'ai.open': '一句话生成',
      'ai.title': '一句话生成',
      'ai.desc': '用一句话描述你的情况或想做的事，AI 会整理成结构化条目，最后由你确认。',
      'ai.inputLabel': '一句话描述',
      'ai.placeholder': '例如：我总是拖延到最后一刻；想三个月内学好英语口语；明天要交周报',
      'ai.generate': '生成草稿',
      'ai.noInput': '请先输入一句话描述。',
      'ai.overwrite': '生成后会跳转到对话，替换输入框里的草稿并自动发送；确认前不会写入任何记录。',
      'ai.sent': '已发送到对话，AI 正在整理…',
      'ai.generating': 'AI 正在整理',
      'ai.waiting': 'AI 正在整理，请稍候',
      'ai.waitingSubmit': '等待在对话中发送（请先打开一个会话）。',
      'ai.waitingHint': '请留在对话中等待结果；若已离开对话，回到对话即可自动拾取，或取消后重试。',
      'ai.go': '去对话',
      'ai.ready': 'AI 草稿待确认',
      'ai.from': '来自描述',
      'ai.failed': 'AI 整理失败',
      'ai.failedShort': 'AI 整理失败',
      'ai.failedHint': '如果对话中已经收到 AI 回复，点「去对话」会自动读取；也可以直接重试。',
      'ai.retry': '重试',
      'ai.cancel': '取消',
      'ai.discard': '丢弃草稿',
      'ai.adopt': '采纳这些',
      'ai.remove': '不要这条',
      'ai.confirmHint': '确认后才会写入你的记录；可以先删掉不需要的条目。',
      'ai.added': '已采纳 AI 草稿。',
      'ai.discarded': '已丢弃 AI 草稿。',
      'ai.weakness': '缺点',
      'ai.learning': '学习',
      'ai.todo': '待办',
      'ai.dockReady': '去面板确认这次生成的条目',
      'ai.dockWaiting': '等待 AI 生成草稿',
      'ai.coach': '✨ 获取改进指导',
      'ai.recoach': '重新指导',
      'ai.coached': '已获指导',
      'ai.adviceAction': '建议行动',
      'ai.adviceSteps': '今天可以做这三步',
      'ai.adviceMetric': '进步信号',
      'ai.adviceReady': '已生成专家指导。',
      'ai.adviceTargetMissing': '这条缺点已不存在，指导未保存。',
      'ai.advicePromptBefore': '你是行为改变教练。针对下面这个缺点，给出专业、共情且可执行的改进方案。输出格式：第一行写一句人话「✅ 指导已生成，请回到自我管理面板查看」，然后输出一个 json 代码块（数据包，插件会自动读取），代码块之后不要写任何内容。对象字段：why（为什么难改的一句话解释）、action（具体的替代动作）、habit（每天两分钟以内的微习惯）、steps（恰好三条今天能做的步骤）、metric（一个可观察的进步信号）。建议要小、具体、现实，不要责备。缺点信息：',
      'ai.promptBefore': '请把下面这句自我管理描述整理成结构化草稿，只用于我的「自我管理」插件。只输出一个 ```json 代码块，不要任何解释或前后缀。JSON 形状：{"weaknesses":[{"title":"","note":"","trigger":"","action":"","severity":2}],"learning":[{"title":"","goal":"","resource":"","note":"","progress":0}],"todos":[{"title":"","priority":"normal","due":""}]}。规则：只生成描述真正涉及的类别，其余数组留空；severity 3 最严重、1 最轻；priority 取 high/normal/low；due 只在描述提到日期时写 YYYY-MM-DD，否则空字符串。描述：',
    }

    const en = {
      'app.title': 'Self Management',
      'app.subtitle': 'Weaknesses · learning · to-dos, kept in sight',
      'app.note': 'Data stays in this browser profile; export a backup now and then.',
      'tab.today': 'Today',
      'tab.weaknesses': 'Weaknesses',
      'tab.learning': 'Learning',
      'tab.todos': 'To-dos',
      'today.greeting': 'A little better than yesterday',
      'today.reminder': "Today's reminder",
      'today.rotate': 'Another',
      'today.record': 'Did it',
      'today.recorded': 'Improvement recorded. Keep going.',
      'today.reviewPrefix': 'Recorded',
      'today.reviewSuffix': 'improvements',
      'today.empty': 'No weaknesses recorded yet. Start with the habit you most want to change.',
      'today.addWeakness': 'Add weakness',
      'today.checkinDone': 'Already reminded yourself today',
      'today.checkinButton': 'Mark today done',
      'today.streakSuffix': 'days',
      'today.todosTitle': 'Due today',
      'today.todosEmpty': 'Nothing due today. Push a learning goal instead.',
      'today.focusTitle': 'Learning focus',
      'today.focusEmpty': 'No learning direction yet. Pick one.',
      'today.openAll': 'View all',
      'today.push': 'Push +10%',
      'today.statOverdue': 'Overdue',
      'today.statDueToday': 'Due today',
      'today.statStreak': 'Streak',
      'today.statActive': 'Open to-dos',
      'today.focusKicker': 'Do this now',
      'today.focusEmptyTitle': 'Start with one small thing',
      'today.focusEmptySub': 'Add a weakness or a to-do and this card will point to your next step.',
      'today.focusActionTodo': 'Mark done',
      'today.addTodo': 'Add to-do',
      'todo.overdueTag': 'Overdue',
      'todo.todayTag': 'Today',
      'todo.importantTag': 'Important',
      'weakness.title': 'My weaknesses',
      'weakness.desc': 'Name it, see it clearly, give it an actionable move.',
      'weakness.add': 'Add weakness',
      'weakness.empty': 'Nothing yet. A weakness is a design problem, not a verdict.',
      'weakness.record': 'Record an improvement',
      'severity.label': 'Severity',
      'weakness.coached': 'Guided',
      'weakness.noteLabel': 'Description',
      'weakness.triggerLabel': 'Triggers',
      'weakness.actionLabel': 'Improvement move',
      'weakness.reviewLabel': 'Recent improvements',
      'weakness.confirmDelete': 'Delete this weakness record?',
      'learning.title': 'Learning directions',
      'learning.desc': 'Turn "should learn" into "learning now".',
      'learning.add': 'Add direction',
      'learning.empty': 'No learning direction yet. Name one you are pushing.',
      'learning.goalLabel': 'Goal',
      'learning.resourceLabel': 'Resource',
      'learning.noteLabel': 'Notes',
      'learning.progressLabel': 'Progress',
      'learning.doneLabel': 'Completed',
      'learning.confirmDelete': 'Delete this learning direction?',
      'todo.title': 'To-dos',
      'todo.desc': 'Only what you will actually push today.',
      'todo.add': 'Add',
      'todo.placeholder': 'What needs doing?',
      'todo.empty': 'No to-dos yet.',
      'todo.filterActive': 'Active',
      'todo.filterDone': 'Done',
      'todo.filterAll': 'All',
      'todo.duePrefix': 'Due',
      'todo.priorityLabel': 'Priority',
      'todo.confirmDelete': 'Delete this to-do?',
      'priority.high': 'High',
      'priority.normal': 'Medium',
      'priority.low': 'Low',
      'severity.high': 'High',
      'severity.normal': 'Medium',
      'severity.low': 'Low',
      'form.addWeakness': 'Add weakness',
      'form.editWeakness': 'Edit weakness',
      'form.addLearning': 'Add learning direction',
      'form.editLearning': 'Edit learning direction',
      'form.addTodo': 'Add to-do',
      'form.editTodo': 'Edit to-do',
      'form.titleLabel': 'Name',
      'form.required': 'Please enter a name',
      'common.save': 'Save',
      'common.cancel': 'Cancel',
      'common.close': 'Close',
      'common.delete': 'Delete',
      'common.edit': 'Edit',
      'common.export': 'Export backup',
      'common.import': 'Import backup',
      'common.reset': 'Clear data',
      'common.resetConfirm': 'This deletes all local data. Continue?',
      'common.resetDone': 'Local data cleared.',
      'common.imported': 'Backup imported.',
      'common.importFailed': 'Import failed: invalid file format.',
      'common.importReadFailed': 'Import failed: could not read the file.',
      'common.importConfirm': 'Importing replaces current data. Continue?',
      'common.exportFailed': 'Export failed, please retry.',
      'common.saveFailed': 'Could not save: browser storage is unavailable or full.',
      'dock.reminder': "Today's reminder",
      'dock.overduePrefix': 'Overdue',
      'dock.overdueSuffix': 'items',
      'dock.open': 'Open self management',
      'dock.dismiss': 'Dismiss reminder',
      'dock.setup': 'Record your first weakness to start.',
      'dock.openShort': 'Open',
      'toast.weaknessAdded': 'Weakness added.',
      'toast.learningAdded': 'Learning direction added.',
      'toast.todoAdded': 'To-do added.',
      'toast.saved': 'Saved.',
      'toast.deleted': 'Deleted.',
      'toast.checkedIn': 'Daily reminder completed.',
      'ai.open': 'One-sentence draft',
      'ai.title': 'One-sentence draft',
      'ai.desc': 'Describe your situation or intention in one sentence; AI drafts structured entries and you confirm them.',
      'ai.inputLabel': 'One-sentence description',
      'ai.placeholder': 'e.g. I always procrastinate; want to speak better English in three months; weekly report due tomorrow',
      'ai.generate': 'Generate draft',
      'ai.noInput': 'Please describe it first.',
      'ai.overwrite': 'Generating opens the conversation, replaces the composer draft and sends it automatically; nothing is saved before you confirm.',
      'ai.sent': 'Sent to the conversation; AI is drafting…',
      'ai.generating': 'AI is drafting',
      'ai.waiting': 'AI is drafting, please wait',
      'ai.waitingSubmit': 'Waiting to send in the conversation (open a session first).',
      'ai.waitingHint': 'Stay in the conversation for the result; if you left it, open it again to pick the draft up, or cancel and retry.',
      'ai.go': 'Open conversation',
      'ai.ready': 'AI draft to confirm',
      'ai.from': 'From',
      'ai.failed': 'AI drafting failed',
      'ai.failedShort': 'AI drafting failed',
      'ai.failedHint': 'If the AI already replied in the conversation, open the conversation to pick it up automatically; or simply retry.',
      'ai.retry': 'Retry',
      'ai.cancel': 'Cancel',
      'ai.discard': 'Discard draft',
      'ai.adopt': 'Adopt these',
      'ai.remove': 'Remove',
      'ai.confirmHint': 'Nothing is saved until you confirm; remove entries you do not want.',
      'ai.added': 'AI draft adopted.',
      'ai.discarded': 'AI draft discarded.',
      'ai.weakness': 'Weakness',
      'ai.learning': 'Learning',
      'ai.todo': 'To-do',
      'ai.dockReady': 'Open the panel to confirm the generated entries',
      'ai.dockWaiting': 'Waiting for the AI draft',
      'ai.coach': '✨ Get expert guidance',
      'ai.recoach': 'Refresh guidance',
      'ai.coached': 'Guided',
      'ai.adviceAction': 'Try this instead',
      'ai.adviceSteps': 'Three steps for today',
      'ai.adviceMetric': 'Progress signal',
      'ai.adviceReady': 'Expert guidance added.',
      'ai.adviceTargetMissing': 'This weakness no longer exists; guidance was not saved.',
      'ai.advicePromptBefore': 'You are a behavior-change coach. Give empathetic, practical guidance for the weakness below. Output format: first one human sentence "Guidance ready — check the Self Management panel", then one json code block (a data payload the plugin reads automatically), and nothing after it. Object fields: why (one sentence on why change is hard), action (a specific replacement behavior), habit (a micro-habit under two minutes daily), steps (exactly three steps doable today), metric (one observable sign of progress). Keep it small, concrete, realistic, and nonjudgmental. Weakness:',
      'ai.promptBefore': 'Turn the sentence below into a structured draft for my "Self Management" plugin. Output ONLY one ```json code block, no explanation or extra text. JSON shape: {"weaknesses":[{"title":"","note":"","trigger":"","action":"","severity":2}],"learning":[{"title":"","goal":"","resource":"","note":"","progress":0}],"todos":[{"title":"","priority":"normal","due":""}]}. Rules: only include categories the sentence is really about, leave the others empty; severity 3 is worst and 1 is mildest; priority is high/normal/low; due is YYYY-MM-DD only when a date is mentioned, otherwise an empty string. Description:',
    }

    // ---------------------------------------------------------------------
    // Translation: `ctx.locale.bind(NS)` is installed by apply(). Components
    // read it at call time so a late locale switch is picked up on the next
    // render.
    // ---------------------------------------------------------------------
    let translate = (key) => key
    let activeLocaleTag = () => undefined
    function tt(key) {
      try {
        return translate(key)
      } catch {
        return key
      }
    }
    function pickT(props) {
      return props && typeof props.t === 'function' ? props.t : tt
    }

    // ---------------------------------------------------------------------
    // Store
    // ---------------------------------------------------------------------
    let stateCache = null
    const dataListeners = new Set()
    let toast = null
    let toastTimer = null
    const toastListeners = new Set()

    function pad2(value) {
      return value < 10 ? '0' + value : String(value)
    }

    function dayKey(date) {
      const d = date || new Date()
      return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate())
    }

    function previousDayKey() {
      const d = new Date()
      d.setDate(d.getDate() - 1)
      return dayKey(d)
    }

    function uid(prefix) {
      return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
    }

    function emptyData() {
      return {
        version: 1,
        weaknesses: [],
        learning: [],
        todos: [],
        checkins: { lastDate: '', streak: 0, total: 0 },
        ai: null,
      }
    }

    function asArray(value) {
      return Array.isArray(value) ? value : []
    }

    function text(value, max) {
      return typeof value === 'string' ? value.slice(0, max || 4000) : ''
    }

    function normalizeAiRequest(raw) {
      if (!raw || typeof raw !== 'object' || typeof raw.prompt !== 'string' || !raw.prompt.trim()) return null
      const stage = raw.stage === 'sent' || raw.stage === 'failed' ? raw.stage : 'pending'
      return {
        prompt: raw.prompt.slice(0, 2000),
        stage,
        kind: raw.kind === 'advice' ? 'advice' : 'draft',
        weaknessId: typeof raw.weaknessId === 'string' ? raw.weaknessId : null,
        at: Number(raw.at) || Date.now(),
        sinceSeq: Math.max(0, Number(raw.sinceSeq) || 0),
        sinceText: typeof raw.sinceText === 'string' ? raw.sinceText.slice(0, 20000) : '',
        attempts: Math.max(0, Number(raw.attempts) || 0),
      }
    }

    function normalizeDraftItems(raw) {
      if (!raw || typeof raw !== 'object') return null
      const cleaned = normalizeData({
        weaknesses: raw.weaknesses,
        learning: raw.learning,
        todos: raw.todos,
      })
      const draft = {
        weaknesses: cleaned.weaknesses,
        learning: cleaned.learning,
        todos: cleaned.todos,
      }
      if (!draft.weaknesses.length && !draft.learning.length && !draft.todos.length) return null
      return draft
    }

    function normalizeAi(raw) {
      if (!raw || typeof raw !== 'object') return null
      const request = normalizeAiRequest(raw.request)
      const draft = normalizeDraftItems(raw.draft)
      if (!request && !draft) return null
      return { request, draft }
    }

    function normalizeSeverity(value) {
      const numeric = Number(value)
      return numeric === 1 || numeric === 3 ? numeric : 2
    }

    function normalizeAdvice(raw) {
      if (!raw || typeof raw !== 'object') return null
      const steps = asArray(raw.steps)
        .filter((step) => typeof step === 'string' && step.trim())
        .slice(0, 5)
        .map((step) => step.trim().slice(0, 200))
      const advice = {
        why: text(raw.why, 300),
        action: text(raw.action, 200),
        habit: text(raw.habit, 200),
        metric: text(raw.metric, 200),
        steps,
        at: typeof raw.at === 'string' ? raw.at : new Date().toISOString(),
      }
      if (!advice.action && !advice.habit && !steps.length && !advice.why && !advice.metric) return null
      return advice
    }

    function capList(list, cap) {
      return list.length > cap ? list.slice(0, cap) : list
    }

    function dedupeById(list, prefix) {
      const seen = new Set()
      return list.map((item) => {
        if (!item.id || seen.has(item.id)) return { ...item, id: uid(prefix) }
        seen.add(item.id)
        return item
      })
    }

    function normalizeData(raw) {
      const base = emptyData()
      if (!raw || typeof raw !== 'object') return base
      const checkins = raw.checkins && typeof raw.checkins === 'object' ? raw.checkins : {}
      const weaknesses = capList(
        dedupeById(
          asArray(raw.weaknesses)
            .filter((item) => item && typeof item === 'object' && typeof item.title === 'string')
            .map((item) => ({
              id: typeof item.id === 'string' && item.id ? item.id : uid('w'),
              title: text(item.title, 120),
              note: text(item.note),
              trigger: text(item.trigger),
              action: text(item.action),
              severity: normalizeSeverity(item.severity),
              advice: normalizeAdvice(item.advice),
              createdAt: typeof item.createdAt === 'string' ? item.createdAt : new Date().toISOString(),
              reviews: asArray(item.reviews)
                .filter((review) => review && typeof review.at === 'string')
                .slice(-500)
                .map((review) => ({
                  at: review.at,
                  note: text(review.note, 500),
                })),
            })),
          'w',
        ),
        500,
      )
      const learning = capList(
        dedupeById(
          asArray(raw.learning)
            .filter((item) => item && typeof item === 'object' && typeof item.title === 'string')
            .map((item) => ({
              id: typeof item.id === 'string' && item.id ? item.id : uid('l'),
              title: text(item.title, 120),
              goal: text(item.goal),
              resource: text(item.resource),
              note: text(item.note),
              progress: Math.max(0, Math.min(100, Number(item.progress) || 0)),
              createdAt: typeof item.createdAt === 'string' ? item.createdAt : new Date().toISOString(),
            })),
          'l',
        ),
        300,
      )
      const todos = capList(
        dedupeById(
          asArray(raw.todos)
            .filter((item) => item && typeof item === 'object' && typeof item.title === 'string')
            .map((item) => ({
              id: typeof item.id === 'string' && item.id ? item.id : uid('t'),
              title: text(item.title, 200),
              priority: item.priority === 'high' || item.priority === 'low' ? item.priority : 'normal',
              due: typeof item.due === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(item.due) ? item.due : '',
              done: !!item.done,
              createdAt: typeof item.createdAt === 'string' ? item.createdAt : new Date().toISOString(),
              doneAt: typeof item.doneAt === 'string' ? item.doneAt : '',
            })),
          't',
        ),
        2000,
      )
      return {
        version: 1,
        weaknesses,
        learning,
        todos,
        checkins: {
          lastDate: typeof checkins.lastDate === 'string' ? checkins.lastDate : '',
          streak: Math.max(0, Number(checkins.streak) || 0),
          total: Math.max(0, Number(checkins.total) || 0),
        },
        ai: normalizeAi(raw.ai),
      }
    }

    function loadData() {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY)
        if (!raw) return emptyData()
        return normalizeData(JSON.parse(raw))
      } catch {
        return emptyData()
      }
    }

    function getData() {
      if (stateCache === null) stateCache = loadData()
      return stateCache
    }

    function publishData() {
      for (const listener of [...dataListeners]) listener()
    }

    function subscribeData(listener) {
      dataListeners.add(listener)
      return () => {
        dataListeners.delete(listener)
      }
    }

    function persist() {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stateCache))
        return true
      } catch {
        return false
      }
    }

    function mutate(producer) {
      stateCache = normalizeData(producer(getData()))
      const saved = persist()
      publishData()
      if (!saved) notify(tt('common.saveFailed'))
    }

    function replaceData(raw) {
      stateCache = normalizeData(raw)
      const saved = persist()
      publishData()
      if (!saved) notify(tt('common.saveFailed'))
    }

    function invalidateFromStorage() {
      stateCache = loadData()
      publishData()
    }

    function notify(message) {
      toast = { message, id: Date.now() + ':' + Math.random() }
      if (toastTimer) clearTimeout(toastTimer)
      toastTimer = setTimeout(() => {
        toast = null
        toastTimer = null
        for (const listener of [...toastListeners]) listener()
      }, 2400)
      for (const listener of [...toastListeners]) listener()
    }

    function getToast() {
      return toast
    }

    function subscribeToast(listener) {
      toastListeners.add(listener)
      return () => {
        toastListeners.delete(listener)
      }
    }

    // ---------------------------------------------------------------------
    // Derived values
    // ---------------------------------------------------------------------
    function hashString(value) {
      let hash = 0
      for (let i = 0; i < value.length; i += 1) hash = (hash * 31 + value.charCodeAt(i)) >>> 0
      return hash
    }

    function pickReminder(data, offset) {
      const list = data.weaknesses
      if (!list.length) return null
      const index = (hashString(dayKey()) + (offset || 0)) % list.length
      return list[index]
    }

    const PRIORITY_WEIGHT = { high: 0, normal: 1, low: 2 }

    function sortTodos(todos) {
      return [...todos].sort((a, b) => {
        if (a.done !== b.done) return a.done ? 1 : -1
        if (a.due && b.due && a.due !== b.due) return a.due < b.due ? -1 : 1
        if (a.due && !b.due) return -1
        if (!a.due && b.due) return 1
        return PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority]
      })
    }

    function countOverdue(todos) {
      const today = dayKey()
      return todos.filter((todo) => !todo.done && todo.due && todo.due < today).length
    }

    function dueTodos(todos) {
      const today = dayKey()
      return sortTodos(todos.filter((todo) => !todo.done && todo.due && todo.due <= today)).slice(0, 6)
    }

    function todoUrgency(todo) {
      if (!todo || todo.done) return ''
      const today = dayKey()
      if (todo.due && todo.due < today) return 'overdue'
      if (todo.due === today) return 'today'
      if (todo.priority === 'high') return 'important'
      return ''
    }

    function urgencyLabelKey(urgency) {
      if (urgency === 'overdue') return 'todo.overdueTag'
      if (urgency === 'today') return 'todo.todayTag'
      if (urgency === 'important') return 'todo.importantTag'
      return ''
    }

    function urgencyTone(urgency) {
      if (urgency === 'overdue') return 'high'
      if (urgency === 'today') return 'mid'
      if (urgency === 'important') return 'brand'
      return 'low'
    }

    function priorityOrder(todo) {
      return PRIORITY_WEIGHT[todo.priority] === undefined ? 1 : PRIORITY_WEIGHT[todo.priority]
    }

    function activeTodos(data) {
      const urgencyOrder = { overdue: 0, today: 1, important: 2, '': 3 }
      return data.todos
        .filter((todo) => !todo.done)
        .sort((left, right) => {
          const leftUrgency = urgencyOrder[todoUrgency(left)]
          const rightUrgency = urgencyOrder[todoUrgency(right)]
          if (leftUrgency !== rightUrgency) return leftUrgency - rightUrgency
          if (left.due && right.due && left.due !== right.due) return left.due < right.due ? -1 : 1
          if (left.due && !right.due) return -1
          if (!left.due && right.due) return 1
          return priorityOrder(left) - priorityOrder(right)
        })
    }

    function topFocusTodo(data) {
      return activeTodos(data).find((todo) => todoUrgency(todo) !== '') || null
    }

    function todayCounts(data) {
      const today = dayKey()
      return {
        overdue: data.todos.filter((todo) => !todo.done && todo.due && todo.due < today).length,
        dueToday: data.todos.filter((todo) => !todo.done && todo.due === today).length,
        active: data.todos.filter((todo) => !todo.done).length,
      }
    }

    function focusLearning(data) {
      return data.learning.find((item) => item.progress < 100) || null
    }

    function formatDate(iso) {
      if (!iso) return ''
      const date = new Date(iso)
      if (Number.isNaN(date.getTime())) return ''
      try {
        return date.toLocaleDateString(activeLocaleTag(), { year: 'numeric', month: 'short', day: 'numeric' })
      } catch {
        return iso.slice(0, 10)
      }
    }

    function formatToday() {
      try {
        return new Date().toLocaleDateString(activeLocaleTag(), {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          weekday: 'long',
        })
      } catch {
        return dayKey()
      }
    }

    function formatDueDate(due) {
      if (!due) return ''
      const date = new Date(due + 'T00:00:00')
      if (Number.isNaN(date.getTime())) return due
      try {
        return date.toLocaleDateString(activeLocaleTag(), { month: 'short', day: 'numeric' })
      } catch {
        return due
      }
    }

    function priorityKey(priority) {
      return priority === 'high' ? 'priority.high' : priority === 'low' ? 'priority.low' : 'priority.normal'
    }

    function severityKey(severity) {
      return severity === 3 ? 'severity.high' : severity === 1 ? 'severity.low' : 'severity.normal'
    }

    function severityTone(severity) {
      return severity === 3 ? 'high' : severity === 1 ? 'low' : 'mid'
    }

    // ---------------------------------------------------------------------
    // Mutations used by both the panel and the reminder strip
    // ---------------------------------------------------------------------
    function addWeakness(draft) {
      mutate((data) => ({
        ...data,
        weaknesses: [
          {
            id: uid('w'),
            title: draft.title,
            note: draft.note || '',
            trigger: draft.trigger || '',
            action: draft.action || '',
            severity: draft.severity || 2,
            createdAt: new Date().toISOString(),
            reviews: [],
          },
          ...data.weaknesses,
        ],
      }))
      notify(tt('toast.weaknessAdded'))
    }

    function updateWeakness(id, draft) {
      mutate((data) => ({
        ...data,
        weaknesses: data.weaknesses.map((item) =>
          item.id === id
            ? {
                ...item,
                title: draft.title,
                note: draft.note || '',
                trigger: draft.trigger || '',
                action: draft.action || '',
                severity: draft.severity || 2,
              }
            : item,
        ),
      }))
      notify(tt('toast.saved'))
    }

    function deleteWeakness(id) {
      mutate((data) => ({ ...data, weaknesses: data.weaknesses.filter((item) => item.id !== id) }))
      notify(tt('toast.deleted'))
    }

    function recordWeaknessImprovement(id) {
      mutate((data) => ({
        ...data,
        weaknesses: data.weaknesses.map((item) =>
          item.id === id
            ? { ...item, reviews: [...item.reviews, { at: new Date().toISOString(), note: '' }].slice(-500) }
            : item,
        ),
      }))
      notify(tt('today.recorded'))
    }

    function addLearning(draft) {
      mutate((data) => ({
        ...data,
        learning: [
          {
            id: uid('l'),
            title: draft.title,
            goal: draft.goal || '',
            resource: draft.resource || '',
            note: draft.note || '',
            progress: Math.max(0, Math.min(100, Number(draft.progress) || 0)),
            createdAt: new Date().toISOString(),
          },
          ...data.learning,
        ],
      }))
      notify(tt('toast.learningAdded'))
    }

    function updateLearning(id, draft) {
      mutate((data) => ({
        ...data,
        learning: data.learning.map((item) =>
          item.id === id
            ? {
                ...item,
                title: draft.title,
                goal: draft.goal || '',
                resource: draft.resource || '',
                note: draft.note || '',
                progress: Math.max(0, Math.min(100, Number(draft.progress) || 0)),
              }
            : item,
        ),
      }))
      notify(tt('toast.saved'))
    }

    function setLearningProgress(id, progress) {
      mutate((data) => ({
        ...data,
        learning: data.learning.map((item) =>
          item.id === id ? { ...item, progress: Math.max(0, Math.min(100, Number(progress) || 0)) } : item,
        ),
      }))
    }

    function deleteLearning(id) {
      mutate((data) => ({ ...data, learning: data.learning.filter((item) => item.id !== id) }))
      notify(tt('toast.deleted'))
    }

    function addTodo(draft) {
      mutate((data) => ({
        ...data,
        todos: [
          {
            id: uid('t'),
            title: draft.title,
            priority: draft.priority || 'normal',
            due: draft.due || '',
            done: false,
            createdAt: new Date().toISOString(),
            doneAt: '',
          },
          ...data.todos,
        ],
      }))
      notify(tt('toast.todoAdded'))
    }

    function updateTodo(id, draft) {
      mutate((data) => ({
        ...data,
        todos: data.todos.map((item) =>
          item.id === id
            ? { ...item, title: draft.title, priority: draft.priority || 'normal', due: draft.due || '' }
            : item,
        ),
      }))
      notify(tt('toast.saved'))
    }

    function toggleTodo(id) {
      mutate((data) => ({
        ...data,
        todos: data.todos.map((item) =>
          item.id === id ? { ...item, done: !item.done, doneAt: item.done ? '' : new Date().toISOString() } : item,
        ),
      }))
    }

    function deleteTodo(id) {
      mutate((data) => ({ ...data, todos: data.todos.filter((item) => item.id !== id) }))
      notify(tt('toast.deleted'))
    }

    function checkIn() {
      const today = dayKey()
      if (getData().checkins.lastDate === today) return
      mutate((data) => {
        const streak = data.checkins.lastDate === previousDayKey() ? data.checkins.streak + 1 : 1
        return {
          ...data,
          checkins: { lastDate: today, streak, total: data.checkins.total + 1 },
        }
      })
      notify(tt('toast.checkedIn'))
    }

    function exportData() {
      try {
        const blob = new Blob([JSON.stringify(getData(), null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const anchor = document.createElement('a')
        anchor.href = url
        anchor.download = 'self-management-' + dayKey() + '.json'
        anchor.click()
        setTimeout(() => URL.revokeObjectURL(url), 1500)
      } catch {
        notify(tt('common.exportFailed'))
      }
    }

    function hasData(data) {
      return (
        data.weaknesses.length > 0 ||
        data.learning.length > 0 ||
        data.todos.length > 0 ||
        Boolean(data.checkins.lastDate)
      )
    }

    function looksLikeData(parsed) {
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return false
      const listKeys = ['weaknesses', 'learning', 'todos']
      if (!listKeys.some((key) => Array.isArray(parsed[key]))) return false
      if (listKeys.some((key) => key in parsed && parsed[key] !== undefined && !Array.isArray(parsed[key]))) return false
      return true
    }

    function importFromText(content) {
      try {
        if (typeof content !== 'string' || content.length > 1500000) throw new Error('too-large')
        const parsed = JSON.parse(content)
        if (!looksLikeData(parsed)) throw new Error('invalid')
        if (hasData(getData()) && !window.confirm(tt('common.importConfirm'))) return
        replaceData(parsed)
        notify(tt('common.imported'))
      } catch {
        notify(tt('common.importFailed'))
      }
    }

    function resetAll() {
      if (!window.confirm(tt('common.resetConfirm'))) return
      replaceData({})
      notify(tt('common.resetDone'))
    }

    // ---------------------------------------------------------------------
    // One-sentence AI drafting.
    //
    // The panel only stores a request; the session-scoped reminder strip owns
    // the composer (inputActions), sends the prompt into the conversation and
    // picks the structured JSON out of the assistant reply. Nothing reaches
    // the real lists until the user confirms the draft in the panel.
    // ---------------------------------------------------------------------
    function beginAiRequest(prompt, kind, weaknessId) {
      mutate((data) => ({
        ...data,
        ai: {
          request: {
            prompt: prompt.trim().slice(0, 2000),
            stage: 'pending',
            kind: kind === 'advice' ? 'advice' : 'draft',
            weaknessId: typeof weaknessId === 'string' ? weaknessId : null,
            at: Date.now(),
            sinceSeq: 0,
            sinceText: '',
            attempts: 0,
          },
          draft: null,
        },
      }))
    }

    function applyAiAdvice(weaknessId, advice) {
      const cleaned = normalizeAdvice(advice)
      if (!cleaned) {
        failAiRequest()
        return false
      }
      let applied = false
      mutate((data) => ({
        ...data,
        weaknesses: data.weaknesses.map((item) => {
          if (item.id !== weaknessId) return item
          applied = true
          return { ...item, advice: cleaned, action: item.action || cleaned.action }
        }),
        ai: null,
      }))
      notify(tt(applied ? 'ai.adviceReady' : 'ai.adviceTargetMissing'))
      return applied
    }

    function markAiRequestSent(sinceSeq, sinceText) {
      mutate((data) => {
        if (!data.ai || !data.ai.request) return data
        return {
          ...data,
          ai: {
            ...data.ai,
            request: {
              ...data.ai.request,
              stage: 'sent',
              sinceSeq: Math.max(0, Number(sinceSeq) || 0),
              sinceText: typeof sinceText === 'string' ? sinceText.slice(0, 20000) : '',
            },
          },
        }
      })
    }

    function failAiRequest() {
      mutate((data) => {
        if (!data.ai || !data.ai.request) return data
        return { ...data, ai: { ...data.ai, request: { ...data.ai.request, stage: 'failed' } } }
      })
    }

    function bumpAiAttempts() {
      mutate((data) => {
        if (!data.ai || !data.ai.request) return data
        return {
          ...data,
          ai: { ...data.ai, request: { ...data.ai.request, attempts: (data.ai.request.attempts || 0) + 1 } },
        }
      })
    }

    function saveAiDraft(rawDraft) {
      const draft = normalizeDraftItems(rawDraft)
      if (!draft) {
        failAiRequest()
        return false
      }
      mutate((data) => ({ ...data, ai: { request: data.ai ? data.ai.request : null, draft } }))
      return true
    }

    function removeAiDraftItem(kind, id) {
      mutate((data) => {
        if (!data.ai || !data.ai.draft || !Array.isArray(data.ai.draft[kind])) return data
        return {
          ...data,
          ai: {
            ...data.ai,
            draft: { ...data.ai.draft, [kind]: data.ai.draft[kind].filter((item) => item.id !== id) },
          },
        }
      })
    }

    function adoptAiDraft() {
      mutate((data) => {
        if (!data.ai || !data.ai.draft) return data
        return {
          ...data,
          weaknesses: [...data.ai.draft.weaknesses, ...data.weaknesses],
          learning: [...data.ai.draft.learning, ...data.learning],
          todos: [...data.ai.draft.todos, ...data.todos],
          ai: null,
        }
      })
      notify(tt('ai.added'))
    }

    function discardAiDraft() {
      mutate((data) => ({ ...data, ai: null }))
      notify(tt('ai.discarded'))
    }

    function cancelAi() {
      mutate((data) => ({ ...data, ai: null }))
    }

    function aiDraftCount(ai) {
      if (!ai || !ai.draft) return 0
      return ai.draft.weaknesses.length + ai.draft.learning.length + ai.draft.todos.length
    }

    function buildAiPrompt(sentence) {
      return tt('ai.promptBefore') + '\n' + sentence.trim() + '\n'
    }

    function buildAdvicePrompt(item) {
      const details = [
        item.title,
        item.trigger ? tt('weakness.triggerLabel') + ': ' + item.trigger : '',
        item.note ? tt('weakness.noteLabel') + ': ' + item.note : '',
      ].filter(Boolean).join('\n')
      return tt('ai.advicePromptBefore') + '\n' + details + '\n'
    }

    function extractAiPayload(replyText) {
      if (!replyText || typeof replyText !== 'string') return null
      let candidate = replyText
      const fence = replyText.match(/```(?:json)?\s*([\s\S]*?)```/i)
      if (fence) candidate = fence[1]
      const start = candidate.indexOf('{')
      const end = candidate.lastIndexOf('}')
      if (start < 0 || end <= start) return null
      try {
        const parsed = JSON.parse(candidate.slice(start, end + 1))
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null
        const draft = normalizeDraftItems(parsed)
        if (draft) return draft
        const advice = normalizeAdvice(parsed)
        return advice ? { kind: 'advice', advice } : null
      } catch {
        return null
      }
    }

    // Chat snapshots are scanned only in the session-scoped reminder strip.
    // Each selector returns one primitive, so unchanged chat state stays inert.
    // The composite is `time\u0001seq\u0001text` because a later explanation
    // must not hide an earlier structured reply.
    function composeReply(node, text) {
      const data = node && node.data
      return String((data && data.time) || 0) + '\u0001' + String((node && node.anchorSeq) || 0) + '\u0001' + text
    }

    function parseReply(composite) {
      if (!composite || typeof composite !== 'string') return null
      const first = composite.indexOf('\u0001')
      const second = composite.indexOf('\u0001', first + 1)
      if (first < 1 || second < 0) return null
      const time = Number(composite.slice(0, first)) || 0
      const seq = Number(composite.slice(first + 1, second)) || 0
      const text = composite.slice(second + 1)
      if (!text) return null
      return { time, seq, text }
    }

    function assistantText(node) {
      const data = node && node.data
      if (!data || data.status === 'running') return ''
      const blocks = Array.isArray(data.blocks) ? data.blocks : []
      return blocks
        .filter((block) => block && block.kind === 'text' && typeof block.text === 'string')
        .map((block) => block.text)
        .join('\n')
        .trim()
    }

    function selectLatestAssistantReply(snapshot) {
      try {
        const order = snapshot && snapshot.order
        const nodes = snapshot && snapshot.nodes
        if (!Array.isArray(order) || !nodes || typeof nodes.get !== 'function') return ''
        for (let i = order.length - 1; i >= 0; i -= 1) {
          const node = nodes.get(order[i])
          if (!node || node.kind !== 'assistant-step') continue
          const text = assistantText(node)
          if (text) return composeReply(node, text)
        }
      } catch {
        /* chat snapshot shape changed; the AI flow stays dormant */
      }
      return ''
    }

    function selectLatestDraftReply(snapshot) {
      try {
        const order = snapshot && snapshot.order
        const nodes = snapshot && snapshot.nodes
        if (!Array.isArray(order) || !nodes || typeof nodes.get !== 'function') return ''
        for (let i = order.length - 1; i >= 0; i -= 1) {
          const node = nodes.get(order[i])
          if (!node || node.kind !== 'assistant-step') continue
          const text = assistantText(node)
          if (text && text.includes('{')) return composeReply(node, text)
        }
      } catch {
        /* chat snapshot shape changed; the AI flow stays dormant */
      }
      return ''
    }

    // Panel navigation is installed by apply(); components only call this.
    let layoutService = null
    let aiSubmitTimer = null
    function openPanel() {
      try {
        if (layoutService) layoutService.selectPanel(PANEL_ID)
      } catch (error) {
        console.error('self-management: cannot open panel', error)
      }
    }

    function goConversation() {
      try {
        if (layoutService) layoutService.selectPanel('conversation')
      } catch (error) {
        console.error('self-management: cannot open conversation', error)
      }
    }

    // ---------------------------------------------------------------------
    // Small presentational pieces
    // ---------------------------------------------------------------------
    function Btn({ variant, children, ...rest }) {
      const variantClass =
        variant === 'primary'
          ? ' sm-btn-primary'
          : variant === 'danger'
            ? ' sm-btn-danger'
            : variant === 'ghost'
              ? ' sm-btn-ghost'
              : ''
      return h('button', { ...rest, type: rest.type || 'button', className: 'sm-btn' + variantClass }, children)
    }

    function Chip({ tone, children }) {
      return h('span', { className: 'sm-chip' + (tone ? ' sm-chip-' + tone : '') }, children)
    }

    function Card({ title, desc, actions, tone, children }) {
      return h(
        'section',
        { className: 'sm-card' + (tone ? ' sm-card-' + tone : '') },
        title
          ? h(
              'div',
              { className: 'sm-card-head' },
              h('div', null, h('h3', { className: 'sm-card-title' }, title), desc ? h('p', { className: 'sm-card-desc' }, desc) : null),
              actions || null,
            )
          : null,
        children,
      )
    }

    function Field({ label, children }) {
      const id = React.useId()
      const control = React.isValidElement(children) ? React.cloneElement(children, { id }) : children
      return h('div', { className: 'sm-field' }, h('label', { htmlFor: id }, label), control)
    }

    function Dialog({ title, subtitle, onClose, children }) {
      useEffect(() => {
        const onKeyDown = (event) => {
          if (event.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
      }, [onClose])
      return h(
        'div',
        { className: 'sm-backdrop' },
        h('div', { className: 'sm-backdrop-dim', onClick: onClose }),
        h(
          'div',
          { className: 'sm-dialog', role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
          h(
            'div',
            { className: 'sm-dialog-head' },
            h('div', null, h('h2', { className: 'sm-dialog-title' }, title), subtitle ? h('p', { className: 'sm-dialog-sub' }, subtitle) : null),
            h('button', { type: 'button', className: 'sm-dialog-close', onClick: onClose, 'aria-label': tt('common.close') }, '×'),
          ),
          children,
        ),
      )
    }

    function FormShell({ t, onCancel, onSubmit, submitLabel, children }) {
      return h(
        'form',
        { className: 'sm-form', onSubmit },
        children,
        h(
          'div',
          { className: 'sm-form-actions' },
          h(Btn, { onClick: onCancel }, t('common.cancel')),
          h(Btn, { type: 'submit', variant: 'primary' }, submitLabel || t('common.save')),
        ),
      )
    }

    // ---------------------------------------------------------------------
    // Forms
    // ---------------------------------------------------------------------
    function WeaknessForm({ t, initial, onCancel, onSubmit }) {
      const item = initial || {}
      const [title, setTitle] = useState(item.title || '')
      const [note, setNote] = useState(item.note || '')
      const [trigger, setTrigger] = useState(item.trigger || '')
      const [action, setAction] = useState(item.action || '')
      const [severity, setSeverity] = useState(item.severity || 2)
      const [error, setError] = useState('')
      const submit = (event) => {
        event.preventDefault()
        if (!title.trim()) {
          setError(t('form.required'))
          return
        }
        onSubmit({ title: title.trim(), note, trigger, action, severity: Number(severity) || 2 })
      }
      return h(
        FormShell,
        { t, onCancel, onSubmit: submit },
        h(
          Field,
          { label: t('form.titleLabel') },
          h('input', { className: 'sm-input', value: title, autoFocus: true, maxLength: 120, onChange: (e) => setTitle(e.target.value) }),
        ),
        error ? h('div', { className: 'sm-error' }, error) : null,
        h(Field, { label: t('weakness.noteLabel') }, h('textarea', { className: 'sm-textarea', rows: 3, value: note, onChange: (e) => setNote(e.target.value) })),
        h(Field, { label: t('weakness.triggerLabel') }, h('input', { className: 'sm-input', value: trigger, onChange: (e) => setTrigger(e.target.value) })),
        h(Field, { label: t('weakness.actionLabel') }, h('input', { className: 'sm-input', value: action, onChange: (e) => setAction(e.target.value) })),
        h(
          Field,
          { label: t('severity.label') },
          h(
            'select',
            { className: 'sm-select', value: String(severity), onChange: (e) => setSeverity(Number(e.target.value)) },
            h('option', { value: '3' }, t('severity.high')),
            h('option', { value: '2' }, t('severity.normal')),
            h('option', { value: '1' }, t('severity.low')),
          ),
        ),
      )
    }

    function LearningForm({ t, initial, onCancel, onSubmit }) {
      const item = initial || {}
      const [title, setTitle] = useState(item.title || '')
      const [goal, setGoal] = useState(item.goal || '')
      const [resource, setResource] = useState(item.resource || '')
      const [note, setNote] = useState(item.note || '')
      const [progress, setProgress] = useState(item.progress || 0)
      const [error, setError] = useState('')
      const submit = (event) => {
        event.preventDefault()
        if (!title.trim()) {
          setError(t('form.required'))
          return
        }
        onSubmit({ title: title.trim(), goal, resource, note, progress: Number(progress) || 0 })
      }
      return h(
        FormShell,
        { t, onCancel, onSubmit: submit },
        h(
          Field,
          { label: t('form.titleLabel') },
          h('input', { className: 'sm-input', value: title, autoFocus: true, maxLength: 120, onChange: (e) => setTitle(e.target.value) }),
        ),
        error ? h('div', { className: 'sm-error' }, error) : null,
        h(Field, { label: t('learning.goalLabel') }, h('input', { className: 'sm-input', value: goal, onChange: (e) => setGoal(e.target.value) })),
        h(Field, { label: t('learning.resourceLabel') }, h('input', { className: 'sm-input', value: resource, onChange: (e) => setResource(e.target.value) })),
        h(Field, { label: t('learning.noteLabel') }, h('textarea', { className: 'sm-textarea', rows: 2, value: note, onChange: (e) => setNote(e.target.value) })),
        h(
          Field,
          { label: t('learning.progressLabel') + ' ' + progress + '%' },
          h('input', {
            className: 'sm-range',
            type: 'range',
            min: 0,
            max: 100,
            step: 5,
            value: progress,
            onChange: (e) => setProgress(Number(e.target.value)),
          }),
        ),
      )
    }

    function TodoForm({ t, initial, onCancel, onSubmit }) {
      const item = initial || {}
      const [title, setTitle] = useState(item.title || '')
      const [priority, setPriority] = useState(item.priority || 'normal')
      const [due, setDue] = useState(item.due || '')
      const [error, setError] = useState('')
      const submit = (event) => {
        event.preventDefault()
        if (!title.trim()) {
          setError(t('form.required'))
          return
        }
        onSubmit({ title: title.trim(), priority, due })
      }
      return h(
        FormShell,
        { t, onCancel, onSubmit: submit },
        h(
          Field,
          { label: t('form.titleLabel') },
          h('input', { className: 'sm-input', value: title, autoFocus: true, maxLength: 200, onChange: (e) => setTitle(e.target.value) }),
        ),
        error ? h('div', { className: 'sm-error' }, error) : null,
        h(
          'div',
          { className: 'sm-field-row' },
          h(
            Field,
            { label: t('todo.priorityLabel') },
            h(
              'select',
              { className: 'sm-select', value: priority, onChange: (e) => setPriority(e.target.value) },
              h('option', { value: 'high' }, t('priority.high')),
              h('option', { value: 'normal' }, t('priority.normal')),
              h('option', { value: 'low' }, t('priority.low')),
            ),
          ),
          h(
            Field,
            { label: t('todo.duePrefix') },
            h('input', { className: 'sm-input', type: 'date', value: due, onChange: (e) => setDue(e.target.value) }),
          ),
        ),
      )
    }

    function AiForm({ t, initial, onCancel, onSubmit }) {
      const [sentence, setSentence] = useState((initial && initial.sentence) || '')
      const [error, setError] = useState('')
      const submit = (event) => {
        event.preventDefault()
        if (!sentence.trim()) {
          setError(t('ai.noInput'))
          return
        }
        onSubmit(sentence.trim())
      }
      return h(
        FormShell,
        { t, onCancel, onSubmit: submit, submitLabel: t('ai.generate') },
        h(
          Field,
          { label: t('ai.inputLabel') },
          h('textarea', {
            className: 'sm-textarea',
            rows: 3,
            value: sentence,
            autoFocus: true,
            maxLength: 1000,
            placeholder: t('ai.placeholder'),
            onChange: (e) => setSentence(e.target.value),
          }),
        ),
        h('p', { className: 'sm-ai-form-hint' }, t('ai.overwrite')),
        error ? h('div', { className: 'sm-error' }, error) : null,
      )
    }

    // ---------------------------------------------------------------------
    // Rows
    // ---------------------------------------------------------------------
    function TodoRow({ todo, t, onToggle, onEdit, onDelete }) {
      const overdue = !todo.done && todo.due && todo.due < dayKey()
      const urgency = todoUrgency(todo)
      return h(
        'div',
        { className: 'sm-todo' + (todo.done ? ' sm-done' : '') + (urgency ? ' sm-todo-' + urgency : '') },
        h('input', {
          type: 'checkbox',
          checked: todo.done,
          'aria-label': todo.title,
          onChange: () => onToggle(todo.id),
        }),
        h(
          'div',
          { className: 'sm-todo-main' },
          h('div', { className: 'sm-todo-title' }, todo.title),
          h(
            'div',
            { className: 'sm-todo-meta' },
            urgency ? h(Chip, { tone: urgencyTone(urgency) }, t(urgencyLabelKey(urgency))) : null,
            !urgency && todo.priority === 'high' ? h(Chip, { tone: 'high' }, t('priority.high')) : null,
            todo.due ? h('span', { className: overdue ? 'sm-overdue' : '' }, t('todo.duePrefix') + ' ' + formatDueDate(todo.due)) : null,
          ),
        ),
        h(
          'div',
          { className: 'sm-item-actions' },
          onEdit ? h(Btn, { variant: 'ghost', onClick: () => onEdit(todo) }, t('common.edit')) : null,
          onDelete ? h(Btn, { variant: 'ghost', onClick: () => onDelete(todo) }, t('common.delete')) : null,
        ),
      )
    }

    function WeaknessCard({ item, t, onEdit, onDelete, onRecord, onCoach }) {
      const lastReview = item.reviews.length ? item.reviews[item.reviews.length - 1] : null
      const hasGuidance = Boolean(item.advice || item.action)
      return h(
        'article',
        { className: 'sm-card sm-entity sm-entity-red' },
        h(
          'div',
          { className: 'sm-entity-head' },
          h('div', { className: 'sm-entity-title' }, item.title),
          h(
            'div',
            { className: 'sm-entity-chips' },
            h(Chip, { tone: severityTone(item.severity) }, t(severityKey(item.severity))),
            item.advice ? h(Chip, { tone: 'brand' }, t('weakness.coached')) : null,
            h(Chip, null, t('today.reviewPrefix') + ' ' + item.reviews.length + ' ' + t('today.reviewSuffix')),
          ),
        ),
        item.note ? h('p', { className: 'sm-entity-note' }, item.note) : null,
        item.trigger ? h('div', { className: 'sm-kv' }, h('b', null, t('weakness.triggerLabel')), ' ' + item.trigger) : null,
        item.advice
          ? h(
              'div',
              { className: 'sm-advice' },
              item.advice.why ? h('p', { className: 'sm-advice-why' }, item.advice.why) : null,
              item.advice.habit || item.advice.action || item.action
                ? h(
                    'div',
                    { className: 'sm-advice-action' },
                    h('b', null, t('ai.adviceAction')),
                    ' ',
                    item.advice.habit || item.advice.action || item.action,
                  )
                : null,
              item.advice.steps.length
                ? h(
                    'div',
                    { className: 'sm-advice-steps' },
                    h('div', { className: 'sm-advice-steps-title' }, t('ai.adviceSteps')),
                    item.advice.steps.map((step, index) =>
                      h(
                        'div',
                        { key: index, className: 'sm-advice-step' },
                        h('span', { className: 'sm-advice-step-no' }, String(index + 1)),
                        h('span', null, step),
                      ),
                    ),
                  )
                : null,
              item.advice.metric
                ? h('div', { className: 'sm-advice-metric' }, h('b', null, t('ai.adviceMetric')), ' ', item.advice.metric)
                : null,
            )
          : item.action
            ? h('div', { className: 'sm-kv' }, h('b', null, t('weakness.actionLabel')), ' ' + item.action)
            : null,
        lastReview ? h('div', { className: 'sm-kv' }, h('b', null, t('weakness.reviewLabel')), ' ' + formatDate(lastReview.at)) : null,
        h(
          'div',
          { className: 'sm-entity-actions' },
          hasGuidance
            ? h(Btn, { variant: 'primary', onClick: () => onRecord(item.id) }, t('weakness.record'))
            : h(Btn, { variant: 'primary', onClick: () => onCoach(item) }, t('ai.coach')),
          hasGuidance ? h(Btn, { variant: 'ghost', onClick: () => onCoach(item) }, t('ai.recoach')) : null,
          h(Btn, { variant: 'ghost', onClick: () => onEdit(item) }, t('common.edit')),
          h(Btn, { variant: 'ghost', onClick: () => onDelete(item) }, t('common.delete')),
        ),
      )
    }

    function LearningCard({ item, t, onEdit, onDelete, onProgress }) {
      const isLink = /^https?:\/\//i.test(item.resource)
      return h(
        'article',
        { className: 'sm-card sm-entity sm-entity-green' },
        h(
          'div',
          { className: 'sm-entity-head' },
          h(
            'div',
            { className: 'sm-entity-title' },
            item.title,
            item.progress >= 100 ? ' ' : null,
            item.progress >= 100 ? h(Chip, { tone: 'done' }, t('learning.doneLabel')) : null,
          ),
          h('div', { className: 'sm-entity-chips' }, h(Chip, null, t('learning.progressLabel') + ' ' + item.progress + '%')),
        ),
        item.goal ? h('div', { className: 'sm-kv' }, h('b', null, t('learning.goalLabel')), ' ' + item.goal) : null,
        item.resource
          ? h(
              'div',
              { className: 'sm-kv' },
              h('b', null, t('learning.resourceLabel')),
              ' ',
              isLink
                ? h('a', { className: 'sm-link', href: item.resource, target: '_blank', rel: 'noreferrer' }, item.resource)
                : item.resource,
            )
          : null,
        item.note ? h('p', { className: 'sm-entity-note' }, item.note) : null,
        h(
          'div',
          { className: 'sm-progress-row' },
          h(
            'div',
            { className: 'sm-progress', role: 'progressbar', 'aria-valuenow': item.progress, 'aria-valuemin': 0, 'aria-valuemax': 100 },
            h('span', { style: { width: item.progress + '%' } }),
          ),
          h('input', {
            className: 'sm-range sm-range-inline',
            type: 'range',
            min: 0,
            max: 100,
            step: 5,
            value: item.progress,
            'aria-label': t('learning.progressLabel'),
            onChange: (e) => onProgress(item.id, Number(e.target.value)),
          }),
        ),
        h(
          'div',
          { className: 'sm-entity-actions' },
          h(Btn, { variant: 'ghost', onClick: () => onEdit(item) }, t('common.edit')),
          h(Btn, { variant: 'ghost', onClick: () => onDelete(item) }, t('common.delete')),
        ),
      )
    }

    function AiDraftCard({ data, t }) {
      const ai = data.ai
      if (!ai) return null
      const request = ai.request
      if (ai.draft) {
        const groups = [
          ['weaknesses', t('ai.weakness'), (item) => item.action || item.trigger || item.note || ''],
          ['learning', t('ai.learning'), (item) => item.goal || item.note || ''],
          ['todos', t('ai.todo'), (item) => [t(priorityKey(item.priority)), item.due ? formatDueDate(item.due) : ''].filter(Boolean).join(' · ')],
        ]
        const total = aiDraftCount(ai)
        return h(
          'section',
          { className: 'sm-card sm-ai-card' },
          h(
            'div',
            { className: 'sm-ai-card-head' },
            h(
              'div',
              { className: 'sm-ai-card-heading' },
              h('h2', { className: 'sm-ai-card-title' }, '✨ ' + t('ai.ready')),
              request ? h('p', { className: 'sm-ai-card-sub' }, t('ai.from') + '：' + request.prompt) : null,
            ),
            h(
              'div',
              { className: 'sm-ai-card-actions' },
              h(Btn, { variant: 'primary', onClick: adoptAiDraft, disabled: total === 0 }, t('ai.adopt')),
              h(Btn, { variant: 'ghost', onClick: discardAiDraft }, t('ai.discard')),
            ),
          ),
          h('p', { className: 'sm-ai-card-hint' }, t('ai.confirmHint')),
          groups.map(([kind, label, summary]) =>
            ai.draft[kind].length === 0
              ? null
              : h(
                  'div',
                  { key: kind, className: 'sm-ai-group' },
                  h('div', { className: 'sm-ai-group-title' }, label + ' · ' + ai.draft[kind].length),
                  ai.draft[kind].map((item) =>
                    h(
                      'div',
                      { key: item.id, className: 'sm-ai-item' },
                      h(
                        'div',
                        { className: 'sm-ai-item-main' },
                        h('div', { className: 'sm-ai-item-title' }, item.title),
                        summary(item) ? h('div', { className: 'sm-ai-item-sub' }, summary(item)) : null,
                      ),
                      h(Btn, { variant: 'ghost', onClick: () => removeAiDraftItem(kind, item.id) }, t('ai.remove')),
                    ),
                  ),
                ),
          ),
        )
      }
      if (!request) return null
      const failed = request.stage === 'failed'
      return h(
        'section',
        { className: 'sm-card sm-ai-card sm-ai-status' },
        h(
          'div',
          { className: 'sm-ai-card-head' },
          h(
            'div',
            { className: 'sm-ai-card-heading' },
            h('h2', { className: 'sm-ai-card-title' }, '✨ ' + (failed ? t('ai.failed') : t('ai.waiting'))),
            h('p', { className: 'sm-ai-card-sub' }, t('ai.from') + '：' + request.prompt),
          ),
          h(
            'div',
            { className: 'sm-ai-card-actions' },
            h(Btn, { onClick: goConversation }, t('ai.go')),
            failed
              ? h(
                  Btn,
                  {
                    variant: 'primary',
                    onClick: () => {
                      beginAiRequest(request.prompt)
                      goConversation()
                    },
                  },
                  t('ai.retry'),
                )
              : null,
            h(Btn, { variant: 'ghost', onClick: cancelAi }, t('ai.cancel')),
          ),
        ),
        failed ? h('p', { className: 'sm-ai-card-hint' }, t('ai.failedHint')) : h('p', { className: 'sm-ai-card-hint' }, request.stage === 'pending' ? t('ai.waitingSubmit') : t('ai.waitingHint')),
      )
    }

    // ---------------------------------------------------------------------
    // Tabs
    // ---------------------------------------------------------------------
    function TodayTab({ data, t, offset, onRotate, onCheckIn, onRecord, onProgress, onAddWeakness, onAddTodo, onAddLearning, onOpenTab, onToggleTodo, onCoach }) {
      const checkedIn = data.checkins.lastDate === dayKey()
      const reminder = pickReminder(data, offset)
      const counts = todayCounts(data)
      const todos = activeTodos(data).slice(0, 5)
      const learning = focusLearning(data)
      const reminderAction = reminder ? (reminder.advice && (reminder.advice.action || reminder.advice.steps[0])) || reminder.action : ''
      const focusTodo = topFocusTodo(data)
      const focus = focusTodo
        ? { kind: 'todo', todo: focusTodo }
        : reminder
          ? { kind: 'weakness', weakness: reminder }
          : learning
            ? { kind: 'learning', learning }
            : null
      const stat = (emoji, label, value, tone) =>
        h(
          'div',
          { className: 'sm-stat sm-tone-' + tone },
          h('div', { className: 'sm-stat-icon' }, emoji),
          h('div', { className: 'sm-stat-value' }, String(value)),
          h('div', { className: 'sm-stat-label' }, label),
        )
      let focusTitle = t('today.focusEmptyTitle')
      let focusMeta = null
      let focusAction = null
      let focusActions = null
      if (focus && focus.kind === 'todo') {
        const urgency = todoUrgency(focus.todo)
        focusTitle = focus.todo.title
        focusMeta = h(
          'div',
          { className: 'sm-focus-meta' },
          urgency ? h(Chip, { tone: urgencyTone(urgency) }, t(urgencyLabelKey(urgency))) : null,
          focus.todo.due ? h(Chip, null, t('todo.duePrefix') + ' ' + formatDueDate(focus.todo.due)) : null,
        )
        focusActions = h(
          'div',
          { className: 'sm-focus-actions' },
          h(Btn, { variant: 'primary', onClick: () => onToggleTodo(focus.todo.id) }, t('today.focusActionTodo')),
          h(Btn, { onClick: () => onOpenTab('todos') }, t('today.openAll')),
        )
      } else if (focus && focus.kind === 'weakness') {
        focusTitle = focus.weakness.title
        focusMeta = h(
          'div',
          { className: 'sm-focus-meta' },
          h(Chip, { tone: severityTone(focus.weakness.severity) }, t(severityKey(focus.weakness.severity))),
          focus.weakness.trigger ? h(Chip, null, focus.weakness.trigger) : null,
        )
        const nextStep = focus.weakness.advice?.steps[0]
        const suggestedAction = focus.weakness.advice?.action || focus.weakness.action || nextStep
        focusAction = suggestedAction
          ? h('div', { className: 'sm-focus-action' }, h('b', null, t('ai.adviceAction')), ' ' + suggestedAction)
          : h('div', { className: 'sm-focus-action' }, t('ai.coach'))
        focusActions = focus.weakness.advice
          ? h(
              'div',
              { className: 'sm-focus-actions' },
              h(Btn, { variant: 'primary', onClick: () => onRecord(focus.weakness.id) }, t('today.record')),
              h(Btn, { onClick: onRotate }, t('today.rotate')),
              h('span', { className: 'sm-muted' }, t('today.reviewPrefix') + ' ' + focus.weakness.reviews.length + ' ' + t('today.reviewSuffix')),
            )
          : h(
              'div',
              { className: 'sm-focus-actions' },
              h(Btn, { variant: 'primary', onClick: () => onCoach(focus.weakness) }, t('ai.coach')),
              h(Btn, { onClick: onRotate }, t('today.rotate')),
            )
      } else if (focus && focus.kind === 'learning') {
        focusTitle = focus.learning.title
        focusMeta = h('div', { className: 'sm-focus-meta' }, h(Chip, null, t('learning.progressLabel') + ' ' + focus.learning.progress + '%'))
        focusAction = focus.learning.goal
          ? h('div', { className: 'sm-focus-action' }, h('b', null, t('learning.goalLabel')), ' ' + focus.learning.goal)
          : null
        focusActions = h(
          'div',
          { className: 'sm-focus-actions' },
          h(Btn, { variant: 'primary', onClick: () => onProgress(focus.learning.id, Math.min(100, focus.learning.progress + 10)) }, t('today.push')),
          h(Btn, { onClick: () => onOpenTab('learning') }, t('today.openAll')),
        )
      } else {
        focusMeta = h('p', { className: 'sm-focus-sub' }, t('today.focusEmptySub'))
        focusActions = h(
          'div',
          { className: 'sm-focus-actions' },
          h(Btn, { variant: 'primary', onClick: onAddWeakness }, t('today.addWeakness')),
          h(Btn, { onClick: onAddTodo }, t('today.addTodo')),
        )
      }
      return h(
        'div',
        { className: 'sm-content' },
        h(
          'div',
          { className: 'sm-dayline' },
          h('span', { className: 'sm-dayline-date' }, formatToday()),
          h('span', { className: 'sm-dayline-greeting' }, t('today.greeting')),
        ),
        h(
          'div',
          { className: 'sm-stats' },
          stat('⏰', t('today.statOverdue'), counts.overdue, 'red'),
          stat('📌', t('today.statDueToday'), counts.dueToday, 'amber'),
          stat('🔥', t('today.statStreak'), data.checkins.streak + ' ' + t('today.streakSuffix'), 'green'),
          stat('📋', t('today.statActive'), counts.active, 'blue'),
        ),
        h(
          'section',
          { className: 'sm-focus-card' },
          h(
            'div',
            { className: 'sm-focus-head' },
            h('span', { className: 'sm-focus-kicker' }, '🎯 ' + t('today.focusKicker')),
            checkedIn
              ? h(Chip, { tone: 'done' }, '✓ ' + t('today.checkinDone'))
              : h(Btn, { onClick: onCheckIn }, t('today.checkinButton')),
          ),
          h('div', { className: 'sm-focus-title' }, focusTitle),
          focusMeta,
          focusAction,
          focus && focus.kind === 'learning'
            ? h('div', { className: 'sm-progress-row' }, h('div', { className: 'sm-progress' }, h('span', { style: { width: focus.learning.progress + '%' } })))
            : null,
          focusActions,
        ),
        h(
          Card,
          { title: '⚡ ' + t('today.todosTitle'), tone: 'blue', actions: h(Btn, { variant: 'ghost', onClick: () => onOpenTab('todos') }, t('today.openAll')) },
          todos.length === 0
            ? h(
                'div',
                { className: 'sm-empty' },
                h('p', null, t('today.todosEmpty')),
                h(Btn, { variant: 'primary', onClick: onAddTodo }, t('today.addTodo')),
              )
            : todos.map((todo) => h(TodoRow, { key: todo.id, todo, t, onToggle: onToggleTodo })),
        ),
        h(
          'div',
          { className: 'sm-grid' },
          h(
            Card,
            { title: '💪 ' + t('today.reminder'), tone: 'red' },
            reminder
              ? h(
                  'div',
                  { className: 'sm-reminder' },
                  h(
                    'div',
                    { className: 'sm-entity-head' },
                    h('div', { className: 'sm-entity-title sm-reminder-title' }, reminder.title),
                    h(
                      'div',
                      { className: 'sm-entity-chips' },
                      h(Chip, { tone: severityTone(reminder.severity) }, t(severityKey(reminder.severity))),
                      reminder.trigger ? h(Chip, null, reminder.trigger) : null,
                    ),
                  ),
                  reminderAction ? h('div', { className: 'sm-kv' }, h('b', null, t('ai.adviceAction')), ' ' + reminderAction) : null,
                  h(
                    'div',
                    { className: 'sm-reminder-actions' },
                    h(Btn, { variant: 'primary', onClick: () => onRecord(reminder.id) }, t('today.record')),
                    h(Btn, { onClick: onRotate }, t('today.rotate')),
                    h('span', { className: 'sm-muted' }, t('today.reviewPrefix') + ' ' + reminder.reviews.length + ' ' + t('today.reviewSuffix')),
                  ),
                )
              : h(
                  'div',
                  { className: 'sm-empty' },
                  h('p', null, t('today.empty')),
                  h(Btn, { variant: 'primary', onClick: onAddWeakness }, t('today.addWeakness')),
                ),
          ),
          h(
            Card,
            { title: '📚 ' + t('today.focusTitle'), tone: 'green', actions: h(Btn, { variant: 'ghost', onClick: () => onOpenTab('learning') }, t('today.openAll')) },
            learning
              ? h(
                  'div',
                  { className: 'sm-focus' },
                  h('div', { className: 'sm-entity-title' }, learning.title),
                  learning.goal ? h('p', { className: 'sm-entity-note' }, learning.goal) : null,
                  h(
                    'div',
                    { className: 'sm-progress-row' },
                    h('div', { className: 'sm-progress' }, h('span', { style: { width: learning.progress + '%' } })),
                    h('span', { className: 'sm-muted' }, learning.progress + '%'),
                  ),
                  h(Btn, { onClick: () => onProgress(learning.id, Math.min(100, learning.progress + 10)) }, t('today.push')),
                )
              : h(
                  'div',
                  { className: 'sm-empty' },
                  h('p', null, t('today.focusEmpty')),
                  h(Btn, { variant: 'primary', onClick: onAddLearning }, t('learning.add')),
                ),
          ),
        ),
      )
    }

    function WeaknessTab({ data, t, onAdd, onEdit, onDelete, onRecord, onCoach }) {
      return h(
        'div',
        { className: 'sm-content' },
        h(
          'div',
          { className: 'sm-section-head' },
          h('div', null, h('h2', { className: 'sm-section-title' }, t('weakness.title')), h('p', { className: 'sm-section-desc' }, t('weakness.desc'))),
          h(Btn, { variant: 'primary', onClick: onAdd }, '+ ' + t('weakness.add')),
        ),
        data.weaknesses.length === 0
          ? h(
              'div',
              { className: 'sm-card sm-card-red sm-empty' },
              h('p', null, t('weakness.empty')),
              h(Btn, { variant: 'primary', onClick: onAdd }, '+ ' + t('weakness.add')),
            )
          : data.weaknesses.map((item) => h(WeaknessCard, { key: item.id, item, t, onEdit, onDelete, onRecord, onCoach })),
      )
    }

    function LearningTab({ data, t, onAdd, onEdit, onDelete, onProgress }) {
      return h(
        'div',
        { className: 'sm-content' },
        h(
          'div',
          { className: 'sm-section-head' },
          h('div', null, h('h2', { className: 'sm-section-title' }, t('learning.title')), h('p', { className: 'sm-section-desc' }, t('learning.desc'))),
          h(Btn, { variant: 'primary', onClick: onAdd }, '+ ' + t('learning.add')),
        ),
        data.learning.length === 0
          ? h(
              'div',
              { className: 'sm-card sm-card-green sm-empty' },
              h('p', null, t('learning.empty')),
              h(Btn, { variant: 'primary', onClick: onAdd }, '+ ' + t('learning.add')),
            )
          : data.learning.map((item) => h(LearningCard, { key: item.id, item, t, onEdit, onDelete, onProgress })),
      )
    }

    function TodosTab({ data, t, onAdd, onEdit, onDelete, onToggle }) {
      const [filter, setFilter] = useState('active')
      const [title, setTitle] = useState('')
      const [priority, setPriority] = useState('normal')
      const [due, setDue] = useState('')
      const submit = (event) => {
        event.preventDefault()
        if (!title.trim()) return
        onAdd({ title: title.trim(), priority, due })
        setTitle('')
        setDue('')
      }
      const visible = data.todos.filter((todo) => (filter === 'all' ? true : filter === 'done' ? todo.done : !todo.done))
      return h(
        'div',
        { className: 'sm-content' },
        h(
          'div',
          { className: 'sm-section-head' },
          h('div', null, h('h2', { className: 'sm-section-title' }, t('todo.title')), h('p', { className: 'sm-section-desc' }, t('todo.desc'))),
          h(
            'div',
            { className: 'sm-seg', role: 'group' },
            h('button', { type: 'button', 'aria-pressed': filter === 'active', onClick: () => setFilter('active') }, t('todo.filterActive')),
            h('button', { type: 'button', 'aria-pressed': filter === 'done', onClick: () => setFilter('done') }, t('todo.filterDone')),
            h('button', { type: 'button', 'aria-pressed': filter === 'all', onClick: () => setFilter('all') }, t('todo.filterAll')),
          ),
        ),
        h(
          'form',
          { className: 'sm-card sm-card-blue sm-add-row', onSubmit: submit },
          h('input', {
            className: 'sm-input sm-add-title',
            value: title,
            placeholder: t('todo.placeholder'),
            maxLength: 200,
            'aria-label': t('todo.placeholder'),
            onChange: (e) => setTitle(e.target.value),
          }),
          h(
            'select',
            { className: 'sm-select sm-add-priority', value: priority, 'aria-label': t('todo.priorityLabel'), onChange: (e) => setPriority(e.target.value) },
            h('option', { value: 'high' }, t('priority.high')),
            h('option', { value: 'normal' }, t('priority.normal')),
            h('option', { value: 'low' }, t('priority.low')),
          ),
          h('input', { className: 'sm-input sm-add-date', type: 'date', value: due, 'aria-label': t('todo.duePrefix'), onChange: (e) => setDue(e.target.value) }),
          h(Btn, { type: 'submit', variant: 'primary' }, t('todo.add')),
        ),
        h(
          'div',
          { className: 'sm-card sm-card-blue sm-list' },
          visible.length === 0
            ? h('div', { className: 'sm-empty' }, t('todo.empty'))
            : sortTodos(visible).map((todo) => h(TodoRow, { key: todo.id, todo, t, onToggle: onToggle, onEdit, onDelete })),
        ),
      )
    }

    // ---------------------------------------------------------------------
    // Reminder strip under the composer
    // ---------------------------------------------------------------------
    function Dock(props) {
      const t = pickT(props)
      const data = useSyncExternalStore(subscribeData, getData, getData)
      const [dismissed, setDismissed] = useState(() => {
        try {
          return window.localStorage.getItem(DOCK_DISMISS_KEY) === dayKey()
        } catch {
          return false
        }
      })
      const inputActions = props.inputActions
      const useChat = props.useChat
      const useChatSafe = typeof useChat === 'function' ? useChat : null
      const latestReply = useChatSafe ? useChatSafe(selectLatestAssistantReply) : ''
      const draftReply = useChatSafe ? useChatSafe(selectLatestDraftReply) : ''
      const ai = data.ai
      const requestStage = ai && ai.request ? ai.request.stage : ''
      const requestAt = ai && ai.request ? ai.request.at : 0

      // A request created in the panel is submitted through this session's
      // composer; the reply is scanned for the structured JSON draft.
      useEffect(() => {
        if (requestStage !== 'pending' || !inputActions || !ai || !ai.request) return
        try {
          inputActions.setDraft(ai.request.kind === 'advice' ? ai.request.prompt : buildAiPrompt(ai.request.prompt))
        } catch {
          failAiRequest()
          return
        }
        const current = parseReply(latestReply)
        markAiRequestSent(current ? current.seq : 0, current ? current.text : '')
        if (aiSubmitTimer) clearTimeout(aiSubmitTimer)
        aiSubmitTimer = setTimeout(() => {
          aiSubmitTimer = null
          try {
            inputActions.submit()
          } catch {
            /* the prompt stays in the composer so Enter can be pressed */
          }
        }, 80)
      }, [requestStage, requestAt, inputActions, latestReply])

      // Accept the draft while the request is waiting, and also after a
      // timeout: a late reply is still useful, and chat history is scanned
      // for the latest structured answer rather than only the newest text.
      useEffect(() => {
        if ((requestStage !== 'sent' && requestStage !== 'failed') || !ai || !ai.request) return
        const request = ai.request
        const draft = parseReply(draftReply)
        const draftNewer =
          draft !== null && (draft.time > (request.at || 0) || draft.seq > (request.sinceSeq || 0))
        if (draftNewer) {
          const payload = extractAiPayload(draft.text)
          if (payload) {
            if (payload.kind === 'advice') {
              if (request.kind === 'advice' && request.weaknessId) applyAiAdvice(request.weaknessId, payload.advice)
              else failAiRequest()
            } else {
              saveAiDraft(payload)
            }
            return
          }
          if (requestStage === 'sent' && draft.text.includes('{')) {
            failAiRequest()
            return
          }
        }
        if (requestStage !== 'sent') return
        const last = parseReply(latestReply)
        if (!last) return
        const lastNewer = last.time > (request.at || 0) || last.seq > (request.sinceSeq || 0)
        if (!lastNewer || last.text === (request.sinceText || '')) return
        // A settled text that already tried to contain JSON but cannot be
        // parsed will not improve; small preamble steps still get retries.
        if (last.text.includes('{')) {
          failAiRequest()
          return
        }
        if ((request.attempts || 0) + 1 >= 3) failAiRequest()
        else bumpAiAttempts()
      }, [requestStage, latestReply, draftReply, requestAt])

      // A busy agent can queue the prompt for minutes; keep the request open
      // long enough and allow a later reply to recover a timed-out request.
      useEffect(() => {
        if (requestStage !== 'sent') return undefined
        const timer = setTimeout(() => {
          const current = getData()
          if (current.ai && current.ai.request && current.ai.request.stage === 'sent') failAiRequest()
        }, 600000)
        return () => clearTimeout(timer)
      }, [requestStage, requestAt])

      if (ai) {
        const ready = !!ai.draft
        const failed = ai.request && ai.request.stage === 'failed'
        const label = ready ? '✨ ' + t('ai.ready') : failed ? '✨ ' + t('ai.failedShort') : '✨ ' + t('ai.generating')
        const text = ready ? t('ai.dockReady') : ai.request ? ai.request.prompt : t('ai.dockWaiting')
        return h(
          'div',
          { className: 'sm-dock sm-dock-ai' },
          h('span', { className: 'sm-dock-label' }, label),
          h('span', { className: 'sm-dock-text' }, text),
          h('button', { type: 'button', className: 'sm-dock-button', onClick: openPanel }, t('dock.openShort')),
        )
      }
      if (dismissed) return null
      const reminder = pickReminder(data, 0)
      const overdue = countOverdue(data.todos)
      const topTodo = dueTodos(data.todos)[0] || null
      const empty = !reminder && data.learning.length === 0 && data.todos.length === 0
      const headline = reminder ? reminder.title : topTodo ? topTodo.title : data.learning[0] ? data.learning[0].title : t('dock.setup')
      const dismiss = () => {
        try {
          window.localStorage.setItem(DOCK_DISMISS_KEY, dayKey())
        } catch {
          /* ignore */
        }
        setDismissed(true)
      }
      return h(
        'div',
        { className: 'sm-dock' },
        h('span', { className: 'sm-dock-label' }, t('dock.reminder')),
        h('span', { className: 'sm-dock-text' }, h('b', null, headline), !empty && topTodo && reminder ? ' · ' + topTodo.title : ''),
        overdue > 0 ? h('span', { className: 'sm-dock-overdue' }, t('dock.overduePrefix') + ' ' + overdue + ' ' + t('dock.overdueSuffix')) : null,
        h('button', { type: 'button', className: 'sm-dock-button', title: t('dock.open'), onClick: openPanel }, t('dock.openShort')),
        h('button', { type: 'button', className: 'sm-dock-close', title: t('dock.dismiss'), 'aria-label': t('dock.dismiss'), onClick: dismiss }, '×'),
      )
    }

    function PanelIcon({ size, active }) {
      const edge = size || 18
      return h(
        'svg',
        {
          width: edge,
          height: edge,
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.8,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          style: { color: active ? 'var(--dsw-alias-brand-primary)' : 'currentColor' },
          'aria-hidden': true,
          focusable: false,
        },
        h('circle', { cx: 12, cy: 12, r: 8 }),
        h('circle', { cx: 12, cy: 12, r: 3.1, fill: 'currentColor', stroke: 'none' }),
        h('path', { d: 'M12 1.9v2.5M12 19.6v2.5M1.9 12h2.5M19.6 12h2.5' }),
      )
    }

    // ---------------------------------------------------------------------
    // Management panel
    // ---------------------------------------------------------------------
    function App(props) {
      const t = pickT(props)
      const data = useSyncExternalStore(subscribeData, getData, getData)
      const currentToast = useSyncExternalStore(subscribeToast, getToast, getToast)
      const [tab, setTab] = useState('today')
      const [dialog, setDialog] = useState(null)
      const [offset, setOffset] = useState(0)
      const fileRef = useRef(null)

      const closeDialog = () => setDialog(null)

      const onImportFile = (event) => {
        const file = event.target.files && event.target.files[0]
        event.target.value = ''
        if (!file) return
        const reader = new FileReader()
        reader.onload = () => importFromText(String(reader.result || ''))
        reader.onerror = () => notify(tt('common.importReadFailed'))
        reader.readAsText(file)
      }

      const requestDeleteWeakness = (item) => {
        if (window.confirm(t('weakness.confirmDelete'))) deleteWeakness(item.id)
      }
      const requestDeleteLearning = (item) => {
        if (window.confirm(t('learning.confirmDelete'))) deleteLearning(item.id)
      }
      const requestDeleteTodo = (item) => {
        if (window.confirm(t('todo.confirmDelete'))) deleteTodo(item.id)
      }

      const submitWeakness = (draft) => {
        if (dialog && dialog.item) updateWeakness(dialog.item.id, draft)
        else addWeakness(draft)
        setDialog(null)
      }
      const submitLearning = (draft) => {
        if (dialog && dialog.item) updateLearning(dialog.item.id, draft)
        else addLearning(draft)
        setDialog(null)
      }
      const submitTodo = (draft) => {
        if (dialog && dialog.item) updateTodo(dialog.item.id, draft)
        else addTodo(draft)
        setDialog(null)
      }

      const startAiDraft = (sentence) => {
        beginAiRequest(sentence)
        setDialog(null)
        goConversation()
        notify(tt('ai.sent'))
      }

      const startAiAdvice = (item) => {
        beginAiRequest(buildAdvicePrompt(item), 'advice', item.id)
        goConversation()
        notify(tt('ai.sent'))
      }

      const tabs = [
        { id: 'today', label: t('tab.today') },
        { id: 'weaknesses', label: t('tab.weaknesses'), count: data.weaknesses.length },
        { id: 'learning', label: t('tab.learning'), count: data.learning.length },
        { id: 'todos', label: t('tab.todos'), count: data.todos.filter((todo) => !todo.done).length },
      ]

      let body = null
      if (tab === 'today') {
        body = h(TodayTab, {
          data,
          t,
          offset,
          onRotate: () => setOffset((value) => value + 1),
          onCheckIn: checkIn,
          onRecord: recordWeaknessImprovement,
          onProgress: setLearningProgress,
          onAddWeakness: () => setDialog({ type: 'weakness', item: null }),
          onAddTodo: () => setDialog({ type: 'todo', item: null }),
          onAddLearning: () => setDialog({ type: 'learning', item: null }),
          onOpenTab: setTab,
          onToggleTodo: toggleTodo,
          onCoach: startAiAdvice,
        })
      } else if (tab === 'weaknesses') {
        body = h(WeaknessTab, {
          data,
          t,
          onAdd: () => setDialog({ type: 'weakness', item: null }),
          onEdit: (item) => setDialog({ type: 'weakness', item }),
          onDelete: requestDeleteWeakness,
          onRecord: recordWeaknessImprovement,
          onCoach: startAiAdvice,
        })
      } else if (tab === 'learning') {
        body = h(LearningTab, {
          data,
          t,
          onAdd: () => setDialog({ type: 'learning', item: null }),
          onEdit: (item) => setDialog({ type: 'learning', item }),
          onDelete: requestDeleteLearning,
          onProgress: setLearningProgress,
        })
      } else {
        body = h(TodosTab, {
          data,
          t,
          onAdd: addTodo,
          onEdit: (item) => setDialog({ type: 'todo', item }),
          onDelete: requestDeleteTodo,
          onToggle: toggleTodo,
        })
      }

      let dialogNode = null
      if (dialog) {
        if (dialog.type === 'ai') {
          dialogNode = h(Dialog, {
            title: t('ai.title'),
            subtitle: t('ai.desc'),
            onClose: closeDialog,
            children: h(AiForm, { t, initial: null, onCancel: closeDialog, onSubmit: startAiDraft }),
          })
        } else if (dialog.type === 'weakness') {
          dialogNode = h(Dialog, {
            title: dialog.item ? t('form.editWeakness') : t('form.addWeakness'),
            subtitle: t('weakness.desc'),
            onClose: closeDialog,
            children: h(WeaknessForm, { t, initial: dialog.item, onCancel: closeDialog, onSubmit: submitWeakness }),
          })
        } else if (dialog.type === 'learning') {
          dialogNode = h(Dialog, {
            title: dialog.item ? t('form.editLearning') : t('form.addLearning'),
            subtitle: t('learning.desc'),
            onClose: closeDialog,
            children: h(LearningForm, { t, initial: dialog.item, onCancel: closeDialog, onSubmit: submitLearning }),
          })
        } else {
          dialogNode = h(Dialog, {
            title: dialog.item ? t('form.editTodo') : t('form.addTodo'),
            onClose: closeDialog,
            children: h(TodoForm, { t, initial: dialog.item, onCancel: closeDialog, onSubmit: submitTodo }),
          })
        }
      }

      return h(
        'div',
        { className: 'sm-root' },
        h(
          'header',
          { className: 'sm-header' },
          h(
            'div',
            { className: 'sm-header-text' },
            h('h1', { className: 'sm-title' }, t('app.title')),
            h('p', { className: 'sm-subtitle' }, t('app.subtitle')),
            h('p', { className: 'sm-note' }, t('app.note')),
          ),
          h(
            'div',
            { className: 'sm-toolbar' },
            h('input', { ref: fileRef, type: 'file', accept: 'application/json,.json', style: { display: 'none' }, onChange: onImportFile }),
            h(Btn, { variant: 'primary', onClick: () => setDialog({ type: 'ai' }) }, '✨ ' + t('ai.open')),
            h(Btn, { onClick: () => fileRef.current && fileRef.current.click() }, t('common.import')),
            h(Btn, { onClick: exportData }, t('common.export')),
            h(Btn, { variant: 'danger', onClick: resetAll }, t('common.reset')),
          ),
        ),
        h(
          'div',
          { className: 'sm-tabs-row' },
          h(
            'nav',
            { className: 'sm-tabs', role: 'tablist' },
            tabs.map((entry) =>
              h(
                'button',
                {
                  key: entry.id,
                  type: 'button',
                  role: 'tab',
                  id: 'sm-tab-' + entry.id,
                  'aria-selected': tab === entry.id,
                  'aria-controls': 'sm-panel-' + entry.id,
                  className: 'sm-tab',
                  onClick: () => setTab(entry.id),
                },
                entry.label,
                entry.count ? h('span', { className: 'sm-tab-count' }, String(entry.count)) : null,
              ),
            ),
          ),
        ),
        h(
          'div',
          { className: 'sm-body', role: 'tabpanel', id: 'sm-panel-' + tab, 'aria-labelledby': 'sm-tab-' + tab },
          h(AiDraftCard, { data, t }),
          body,
        ),
        dialogNode,
        currentToast ? h('div', { className: 'sm-toast', role: 'status' }, currentToast.message) : null,
      )
    }

    // ---------------------------------------------------------------------
    // Styles: theme tokens only, so light/dark follow the host.
    // ---------------------------------------------------------------------
    const CSS = `
.sm-root { height: 100%; min-height: 0; display: flex; flex-direction: column; align-items: center; gap: 16px; box-sizing: border-box; overflow: auto; padding: 0 clamp(24px, 4vw, 48px) 48px; background: var(--dsw-alias-bg-base); color: var(--dsw-alias-label-primary); }
.sm-header { width: 100%; max-width: 960px; box-sizing: border-box; display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; padding-top: 28px; }
[data-platform="darwin"] .sm-header { padding-top: calc(28px + var(--dsh-frame-top-clearance, 0px)); }
.sm-header-text { min-width: 0; }
.sm-title { margin: 0; font-size: 20px; font-weight: 500; line-height: 28px; }
.sm-subtitle { margin: 4px 0 0; font-size: 13px; line-height: 20px; color: var(--dsw-alias-label-secondary); }
.sm-note { margin: 2px 0 0; font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-secondary); opacity: .85; }
.sm-toolbar { display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end; flex-shrink: 0; }
.sm-tabs-row { width: 100%; max-width: 960px; box-sizing: border-box; display: flex; }
.sm-tabs { width: max-content; max-width: 100%; box-sizing: border-box; display: inline-flex; gap: 2px; padding: 3px; border-radius: 9px; background: var(--dsw-alias-bg-layer-2); }
.sm-tab { appearance: none; border: none; background: transparent; color: var(--dsw-alias-label-secondary); font: inherit; font-size: 13px; line-height: 20px; padding: 5px 12px; cursor: pointer; border-radius: 7px; }
.sm-tab:hover { color: var(--dsw-alias-label-primary); }
.sm-tab[aria-selected="true"] { color: var(--dsw-alias-label-primary); background: var(--dsw-alias-bg-layer-1); font-weight: 500; }
.sm-tab:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: -2px; }
.sm-body { width: 100%; max-width: 960px; box-sizing: border-box; }
.sm-content { display: flex; flex-direction: column; gap: 14px; }
.sm-card { background: var(--dsw-alias-bg-layer-1); border: 1px solid var(--dsw-alias-border-l1); border-radius: 10px; padding: 14px 16px; box-sizing: border-box; }
.sm-card-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 6px; }
.sm-card-title { margin: 0; font-size: 13px; font-weight: 600; line-height: 1.5; }
.sm-card-desc { margin: 2px 0 0; font-size: 12px; color: var(--dsw-alias-label-secondary); }
.sm-section-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 2px; }
.sm-section-title { margin: 0; font-size: 15px; font-weight: 600; }
.sm-section-desc { margin: 3px 0 0; font-size: 12px; color: var(--dsw-alias-label-secondary); }
.sm-hero { display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; flex-wrap: wrap; }
.sm-hero-main { min-width: 0; }
.sm-hero-date { font-size: 12px; color: var(--dsw-alias-label-secondary); }
.sm-hero-greeting { font-size: 16px; font-weight: 600; margin-top: 4px; }
.sm-hero-side { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; text-align: right; }
.sm-streak { font-size: 13px; font-weight: 600; }
.sm-streak-hint { font-size: 11.5px; color: var(--dsw-alias-label-secondary); max-width: 260px; line-height: 1.5; }
.sm-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; }
.sm-entity { display: flex; flex-direction: column; gap: 6px; }
.sm-entity-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
.sm-entity-title { font-size: 13.5px; font-weight: 600; line-height: 1.5; word-break: break-word; }
.sm-entity-chips { display: flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end; }
.sm-entity-note { margin: 2px 0 0; font-size: 12.5px; line-height: 1.6; color: var(--dsw-alias-label-secondary); white-space: pre-wrap; word-break: break-word; }
.sm-kv { font-size: 12px; line-height: 1.6; color: var(--dsw-alias-label-secondary); word-break: break-word; }
.sm-kv b { color: var(--dsw-alias-label-primary); font-weight: 500; }
.sm-entity-actions { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 4px; }
.sm-reminder { display: flex; flex-direction: column; gap: 6px; }
.sm-reminder-title { font-size: 15px; }
.sm-reminder-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 8px; }
.sm-focus { display: flex; flex-direction: column; gap: 8px; align-items: flex-start; }
.sm-muted { font-size: 11.5px; color: var(--dsw-alias-label-secondary); }
.sm-overdue-count { font-size: 12px; color: var(--dsw-alias-state-error-primary); margin-bottom: 2px; }
.sm-chip { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; line-height: 16px; padding: 1px 7px; border-radius: 999px; border: 1px solid var(--dsw-alias-border-l1); color: var(--dsw-alias-label-secondary); white-space: nowrap; }
.sm-chip-high { color: var(--dsw-alias-state-error-primary); border-color: var(--dsw-alias-state-error-primary); }
.sm-chip-mid { color: var(--dsw-alias-state-warn-primary); border-color: var(--dsw-alias-state-warn-primary); }
.sm-chip-low { color: var(--dsw-alias-label-secondary); }
.sm-chip-done { color: var(--dsw-alias-state-success-primary); border-color: var(--dsw-alias-state-success-primary); }
.sm-btn { appearance: none; border: 1px solid var(--dsw-alias-border-l2); background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); border-radius: 6px; font: inherit; font-size: 12px; line-height: 1.5; padding: 5px 10px; cursor: pointer; white-space: nowrap; }
.sm-btn:hover { background: var(--dsw-alias-bg-layer-2); }
.sm-btn:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 1px; }
.sm-btn-primary { color: var(--dsw-alias-brand-primary); border-color: var(--dsw-alias-brand-primary); }
.sm-btn-ghost { border-color: transparent; background: transparent; color: var(--dsw-alias-label-secondary); }
.sm-btn-ghost:hover { background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); }
.sm-btn-danger { color: var(--dsw-alias-state-error-primary); border-color: var(--dsw-alias-border-l1); }
.sm-empty { color: var(--dsw-alias-label-secondary); font-size: 12.5px; line-height: 1.7; padding: 10px 0; display: flex; flex-direction: column; align-items: flex-start; gap: 8px; }
.sm-empty p { margin: 0; }
.sm-input, .sm-textarea, .sm-select { width: 100%; box-sizing: border-box; font: inherit; font-size: 13px; color: var(--dsw-alias-label-primary); background: var(--dsw-alias-bg-layer-2); border: 1px solid var(--dsw-alias-border-l1); border-radius: 6px; padding: 6px 9px; }
.sm-textarea { resize: vertical; min-height: 62px; }
.sm-input:focus, .sm-textarea:focus, .sm-select:focus { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: -1px; }
.sm-range { width: 100%; accent-color: var(--dsw-alias-brand-primary); }
.sm-range-inline { width: 130px; flex-shrink: 0; }
.sm-field { display: flex; flex-direction: column; gap: 4px; }
.sm-field > label { font-size: 12px; color: var(--dsw-alias-label-secondary); }
.sm-field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.sm-form { display: flex; flex-direction: column; gap: 12px; margin-top: 12px; }
.sm-form-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 4px; }
.sm-error { color: var(--dsw-alias-state-error-primary); font-size: 12px; }
.sm-backdrop { position: fixed; inset: 0; z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 24px; }
.sm-backdrop-dim { position: absolute; inset: 0; background: var(--dsw-alias-bg-base); opacity: .62; }
.sm-backdrop-dim:hover { cursor: pointer; }
.sm-dialog { position: relative; width: min(480px, 100%); max-height: 85vh; overflow: auto; background: var(--dsw-alias-bg-overlay); border: 1px solid var(--dsw-alias-border-l2); border-radius: 12px; padding: 18px; box-sizing: border-box; }
.sm-dialog-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.sm-dialog-title { margin: 0; font-size: 15px; font-weight: 600; }
.sm-dialog-sub { margin: 3px 0 0; font-size: 12px; color: var(--dsw-alias-label-secondary); }
.sm-dialog-close { appearance: none; border: none; background: transparent; color: var(--dsw-alias-label-secondary); font-size: 18px; line-height: 1; cursor: pointer; padding: 2px 4px; border-radius: 4px; }
.sm-dialog-close:hover { background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); }
.sm-todo { display: flex; align-items: flex-start; gap: 9px; padding: 9px 0; border-top: 1px solid var(--dsw-alias-border-l1); }
.sm-todo:first-child { border-top: none; padding-top: 4px; }
.sm-todo input[type="checkbox"] { width: 15px; height: 15px; margin: 2px 0 0; accent-color: var(--dsw-alias-brand-primary); flex-shrink: 0; }
.sm-todo-main { flex: 1; min-width: 0; }
.sm-todo-title { font-size: 13px; line-height: 1.55; word-break: break-word; }
.sm-todo-meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 3px; font-size: 11.5px; color: var(--dsw-alias-label-secondary); }
.sm-done .sm-todo-title { color: var(--dsw-alias-label-secondary); text-decoration: line-through; }
.sm-overdue { color: var(--dsw-alias-state-error-primary); }
.sm-item-actions { display: flex; gap: 4px; flex-shrink: 0; }
.sm-add-row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.sm-add-title { flex: 1 1 220px; width: auto; min-width: 160px; }
.sm-add-priority { width: auto; flex: 0 0 auto; }
.sm-add-date { width: auto; flex: 0 0 auto; }
.sm-list { padding-top: 10px; padding-bottom: 10px; }
.sm-seg { display: inline-flex; border: 1px solid var(--dsw-alias-border-l1); border-radius: 8px; padding: 2px; gap: 2px; background: var(--dsw-alias-bg-layer-1); }
.sm-seg button { appearance: none; border: none; background: transparent; color: var(--dsw-alias-label-secondary); font: inherit; font-size: 12px; padding: 4px 10px; border-radius: 6px; cursor: pointer; }
.sm-seg button[aria-pressed="true"] { background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); }
.sm-seg button:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: -2px; }
.sm-progress-row { display: flex; align-items: center; gap: 10px; margin-top: 4px; }
.sm-progress { flex: 1; height: 6px; border-radius: 999px; background: var(--dsw-alias-bg-layer-2); overflow: hidden; }
.sm-progress > span { display: block; height: 100%; background: var(--dsw-alias-brand-primary); border-radius: 999px; }
.sm-link { color: var(--dsw-alias-brand-primary); text-decoration: none; word-break: break-all; }
.sm-link:hover { text-decoration: underline; }
.sm-toast { position: fixed; left: 50%; bottom: 26px; transform: translateX(-50%); z-index: 1200; background: var(--dsw-alias-bg-overlay); border: 1px solid var(--dsw-alias-border-l2); color: var(--dsw-alias-label-primary); border-radius: 8px; padding: 8px 14px; font-size: 12.5px; line-height: 1.5; max-width: 70vw; }
.sm-dock { display: flex; align-items: center; gap: 8px; width: 100%; box-sizing: border-box; min-width: 0; padding: 5px 10px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 8px; background: var(--dsw-alias-bg-layer-1); font-size: 12px; color: var(--dsw-alias-label-secondary); }
.sm-dock-label { flex-shrink: 0; color: var(--dsw-alias-label-secondary); }
.sm-dock-text { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--dsw-alias-label-secondary); }
.sm-dock-text b { color: var(--dsw-alias-label-primary); font-weight: 600; }
.sm-dock-overdue { flex-shrink: 0; color: var(--dsw-alias-state-error-primary); }
.sm-dock-button { appearance: none; border: none; background: transparent; color: var(--dsw-alias-brand-primary); font: inherit; font-size: 12px; cursor: pointer; padding: 2px 4px; white-space: nowrap; flex-shrink: 0; }
.sm-dock-button:hover { text-decoration: underline; }
.sm-dock-close { appearance: none; border: none; background: transparent; color: var(--dsw-alias-label-secondary); font-size: 14px; line-height: 1; cursor: pointer; padding: 2px 5px; flex-shrink: 0; border-radius: 4px; }
.sm-dock-close:hover { background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); }
.sm-ai-card { border-color: var(--dsw-alias-brand-primary); }
.sm-ai-card-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.sm-ai-card-heading { min-width: 0; }
.sm-ai-card-title { margin: 0; font-size: 14px; font-weight: 600; }
.sm-ai-card-sub { margin: 3px 0 0; font-size: 12px; color: var(--dsw-alias-label-secondary); word-break: break-word; }
.sm-ai-card-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.sm-ai-card-hint { margin: 8px 0 0; font-size: 11.5px; line-height: 1.6; color: var(--dsw-alias-label-secondary); }
.sm-ai-group { margin-top: 10px; }
.sm-ai-group-title { font-size: 12px; font-weight: 600; margin-bottom: 2px; }
.sm-ai-item { display: flex; align-items: flex-start; gap: 8px; padding: 6px 0; border-top: 1px solid var(--dsw-alias-border-l1); }
.sm-ai-item-main { flex: 1; min-width: 0; }
.sm-ai-item-title { font-size: 13px; line-height: 1.5; word-break: break-word; }
.sm-ai-item-sub { margin-top: 2px; font-size: 11.5px; color: var(--dsw-alias-label-secondary); word-break: break-word; }
.sm-ai-form-hint { margin: 0; font-size: 11.5px; line-height: 1.6; color: var(--dsw-alias-label-secondary); }
.sm-dock-ai { border-color: var(--dsw-alias-brand-primary); }
/* ---- v2: clearer hierarchy, larger type, focus-first layout ---- */
.sm-root { font-size: 14px; line-height: 1.6; gap: 18px; }
.sm-header { padding-top: 30px; }
.sm-title { font-size: 24px; line-height: 32px; font-weight: 600; }
.sm-subtitle { font-size: 14px; line-height: 22px; }
.sm-note { font-size: 12.5px; line-height: 18px; }
.sm-toolbar .sm-btn { border-color: transparent; background: transparent; color: var(--dsw-alias-label-secondary); }
.sm-toolbar .sm-btn:hover { background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); }
.sm-toolbar .sm-btn-primary { border-color: var(--dsw-alias-brand-primary); background: transparent; color: var(--dsw-alias-brand-primary); font-weight: 600; }
.sm-toolbar .sm-btn-danger { color: var(--dsw-alias-state-error-primary); }
.sm-tabs { padding: 4px; border-radius: 10px; gap: 4px; }
.sm-tab { font-size: 14px; line-height: 22px; padding: 6px 14px; border-radius: 8px; display: inline-flex; align-items: center; gap: 6px; }
.sm-tab-count { font-size: 12px; line-height: 18px; padding: 0 7px; border-radius: 999px; background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-secondary); }
.sm-tab[aria-selected="true"] .sm-tab-count { background: transparent; color: var(--dsw-alias-brand-primary); font-weight: 600; }
.sm-btn { font-size: 13px; padding: 7px 12px; border-radius: 8px; }
.sm-btn-primary { font-weight: 600; }
.sm-card { border-radius: 12px; padding: 16px 18px; }
.sm-card-title { font-size: 15px; }
.sm-section-title { font-size: 18px; line-height: 26px; }
.sm-section-desc { font-size: 13px; }
.sm-entity-title { font-size: 15px; }
.sm-kv { font-size: 13px; }
.sm-chip { font-size: 12px; line-height: 18px; padding: 2px 9px; }
.sm-chip-brand { color: var(--dsw-alias-brand-primary); border-color: var(--dsw-alias-brand-primary); }
.sm-empty { font-size: 13.5px; }
.sm-input, .sm-textarea, .sm-select { font-size: 14px; padding: 8px 10px; }
.sm-todo-title { font-size: 14px; }
.sm-todo input[type="checkbox"] { width: 17px; height: 17px; }
.sm-todo-meta { font-size: 12px; }
.sm-dialog-title { font-size: 16px; }
.sm-ai-card-title { font-size: 15px; }
.sm-dayline { width: 100%; max-width: 960px; display: flex; align-items: baseline; gap: 12px; }
.sm-dayline-date { font-size: 16px; font-weight: 700; }
.sm-dayline-greeting { font-size: 13px; color: var(--dsw-alias-label-secondary); }
.sm-stats { width: 100%; max-width: 960px; box-sizing: border-box; display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; }
.sm-stat { background: var(--dsw-alias-bg-layer-1); border: 1px solid var(--dsw-alias-border-l1); border-radius: 12px; padding: 12px 16px; }
.sm-stat-value { font-size: 26px; line-height: 34px; font-weight: 700; }
.sm-stat-label { margin-top: 2px; font-size: 12.5px; color: var(--dsw-alias-label-secondary); }
.sm-stat-danger .sm-stat-value { color: var(--dsw-alias-state-error-primary); }
.sm-stat-warn .sm-stat-value { color: var(--dsw-alias-state-warn-primary); }
.sm-focus-card { width: 100%; max-width: 960px; box-sizing: border-box; background: var(--dsw-alias-bg-layer-1); border: 1px solid var(--dsw-alias-brand-primary); border-left-width: 4px; border-radius: 14px; padding: 18px 20px; display: flex; flex-direction: column; gap: 10px; }
.sm-focus-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.sm-focus-kicker { font-size: 13px; font-weight: 700; color: var(--dsw-alias-brand-primary); letter-spacing: .02em; }
.sm-focus-title { font-size: 22px; line-height: 30px; font-weight: 700; word-break: break-word; }
.sm-focus-meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.sm-focus-action { font-size: 14px; color: var(--dsw-alias-label-secondary); }
.sm-focus-action b { color: var(--dsw-alias-label-primary); font-weight: 500; }
.sm-focus-sub { margin: 0; font-size: 14px; color: var(--dsw-alias-label-secondary); }
.sm-focus-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-top: 2px; }
.sm-focus-actions .sm-btn-primary { font-size: 14px; padding: 8px 16px; }
/* ---- v3: colorful category cards (theme-token tints only) ---- */
.sm-tone-red { --sm-accent: var(--dsw-alias-state-error-primary); }
.sm-tone-amber { --sm-accent: var(--dsw-alias-state-warn-primary); }
.sm-tone-green { --sm-accent: var(--dsw-alias-state-success-primary); }
.sm-tone-blue { --sm-accent: var(--dsw-alias-brand-primary); }
.sm-card-red { border-top: 3px solid var(--dsw-alias-state-error-primary); }
.sm-card-green { border-top: 3px solid var(--dsw-alias-state-success-primary); }
.sm-card-blue { border-top: 3px solid var(--dsw-alias-brand-primary); }
.sm-stat { background: color-mix(in srgb, var(--sm-accent) 10%, transparent); border: 1px solid color-mix(in srgb, var(--sm-accent) 32%, transparent); }
.sm-stat-icon { font-size: 18px; line-height: 24px; }
.sm-stat-value { color: var(--sm-accent); }
.sm-stat-label { color: var(--dsw-alias-label-primary); opacity: .78; }
.sm-focus-card { background: linear-gradient(135deg, color-mix(in srgb, var(--dsw-alias-brand-primary) 12%, transparent), transparent 55%); }
.sm-tab[aria-selected="true"] { background: color-mix(in srgb, var(--dsw-alias-brand-primary) 14%, transparent); color: var(--dsw-alias-brand-primary); }
.sm-entity-red { border-left: 3px solid var(--dsw-alias-state-error-primary); }
.sm-entity-green { border-left: 3px solid var(--dsw-alias-state-success-primary); }
.sm-todo-overdue, .sm-todo-today, .sm-todo-important { border-left: 3px solid var(--sm-accent, transparent); padding-left: 10px; border-radius: 8px; }
.sm-todo-overdue { --sm-accent: var(--dsw-alias-state-error-primary); }
.sm-todo-today { --sm-accent: var(--dsw-alias-state-warn-primary); }
.sm-todo-important { --sm-accent: var(--dsw-alias-brand-primary); }
.sm-ai-card { background: linear-gradient(135deg, color-mix(in srgb, var(--dsw-alias-brand-primary) 10%, transparent), transparent 60%); }
/* ---- v4: saturated category fills + expert advice block ---- */
.sm-card-red { background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 14%, var(--dsw-alias-bg-base)); border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary) 40%, transparent); border-top-width: 4px; }
.sm-card-green { background: color-mix(in srgb, var(--dsw-alias-state-success-primary) 14%, var(--dsw-alias-bg-base)); border-color: color-mix(in srgb, var(--dsw-alias-state-success-primary) 40%, transparent); border-top-width: 4px; }
.sm-card-blue { background: color-mix(in srgb, var(--dsw-alias-brand-primary) 14%, var(--dsw-alias-bg-base)); border-color: color-mix(in srgb, var(--dsw-alias-brand-primary) 40%, transparent); border-top-width: 4px; }
.sm-entity-red { background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 12%, var(--dsw-alias-bg-base)); border-left-width: 4px; }
.sm-entity-green { background: color-mix(in srgb, var(--dsw-alias-state-success-primary) 12%, var(--dsw-alias-bg-base)); border-left-width: 4px; }
.sm-stat { background: color-mix(in srgb, var(--sm-accent) 18%, var(--dsw-alias-bg-base)); border-color: color-mix(in srgb, var(--sm-accent) 45%, transparent); }
.sm-focus-card { background: linear-gradient(135deg, color-mix(in srgb, var(--dsw-alias-brand-primary) 18%, transparent), transparent 65%); }
.sm-ai-card { background: linear-gradient(135deg, color-mix(in srgb, var(--dsw-alias-brand-primary) 14%, transparent), transparent 65%); }
.sm-todo-overdue { background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 8%, transparent); }
.sm-todo-today { background: color-mix(in srgb, var(--dsw-alias-state-warn-primary) 8%, transparent); }
.sm-todo-important { background: color-mix(in srgb, var(--dsw-alias-brand-primary) 8%, transparent); }
.sm-advice { display: flex; flex-direction: column; gap: 8px; padding: 12px 14px; border-radius: 10px; background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 8%, transparent); }
.sm-advice-why { margin: 0; font-size: 13.5px; color: var(--dsw-alias-label-secondary); }
.sm-advice-action { font-size: 14px; }
.sm-advice-action b { font-weight: 600; color: var(--dsw-alias-state-error-primary); margin-right: 6px; }
.sm-advice-steps-title { font-size: 12.5px; font-weight: 600; color: var(--dsw-alias-label-secondary); margin-bottom: 4px; }
.sm-advice-step { display: flex; align-items: baseline; gap: 8px; font-size: 13.5px; }
.sm-advice-step-no { flex: none; width: 20px; height: 20px; border-radius: 999px; display: inline-flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: var(--dsw-alias-bg-base); background: var(--dsw-alias-state-error-primary); }
.sm-advice-metric { font-size: 13px; color: var(--dsw-alias-label-secondary); }
.sm-advice-metric b { color: var(--dsw-alias-label-primary); font-weight: 600; margin-right: 6px; }
/* ---- v5: vivid pastel palette, explicit light/dark ---- */
.sm-root { --c-red:#DC2626; --c-red-bg:#FEE2E2; --c-amber:#D97706; --c-amber-bg:#FEF3C7; --c-green:#059669; --c-green-bg:#D1FAE5; --c-blue:#2563EB; --c-blue-bg:#DBEAFE; --c-purple:#7C3AED; --c-purple-bg:#EDE9FE; }
@media (prefers-color-scheme: dark) {
  .sm-root { --c-red:#F87171; --c-red-bg:#3B1515; --c-amber:#FBBF24; --c-amber-bg:#3B2E0E; --c-green:#34D399; --c-green-bg:#0E2E22; --c-blue:#60A5FA; --c-blue-bg:#152238; --c-purple:#A78BFA; --c-purple-bg:#241A3B; }
}
.sm-tone-red { --sm-accent: var(--c-red); --sm-accent-bg: var(--c-red-bg); }
.sm-tone-amber { --sm-accent: var(--c-amber); --sm-accent-bg: var(--c-amber-bg); }
.sm-tone-green { --sm-accent: var(--c-green); --sm-accent-bg: var(--c-green-bg); }
.sm-tone-blue { --sm-accent: var(--c-blue); --sm-accent-bg: var(--c-blue-bg); }
.sm-stat { background: var(--sm-accent-bg); border: 1px solid var(--sm-accent); }
.sm-stat-value { color: var(--sm-accent); }
.sm-stat-label { color: var(--dsw-alias-label-primary); opacity: .8; }
.sm-card-red { background: var(--c-red-bg); border-top: 4px solid var(--c-red); border-color: var(--c-red-bg); }
.sm-card-green { background: var(--c-green-bg); border-top: 4px solid var(--c-green); border-color: var(--c-green-bg); }
.sm-card-blue { background: var(--c-blue-bg); border-top: 4px solid var(--c-blue); border-color: var(--c-blue-bg); }
.sm-entity-red { background: var(--c-red-bg); border-left: 4px solid var(--c-red); border-color: var(--c-red-bg); }
.sm-entity-green { background: var(--c-green-bg); border-left: 4px solid var(--c-green); border-color: var(--c-green-bg); }
.sm-todo-overdue { background: var(--c-red-bg); border-left-color: var(--c-red); }
.sm-todo-today { background: var(--c-amber-bg); border-left-color: var(--c-amber); }
.sm-todo-important { background: var(--c-blue-bg); border-left-color: var(--c-blue); }
.sm-focus-card { background: linear-gradient(135deg, var(--c-blue-bg), transparent 75%); border: 2px solid var(--c-blue); border-radius: 16px; }
.sm-focus-kicker { color: var(--c-blue); font-size: 14px; }
.sm-focus-title { font-size: 24px; }
.sm-tab[aria-selected="true"] { background: var(--c-blue-bg); color: var(--c-blue); font-weight: 600; }
.sm-ai-card { background: linear-gradient(135deg, var(--c-purple-bg), transparent 70%); border-top: 4px solid var(--c-purple); }
.sm-ai-card-title { color: var(--c-purple); }
.sm-chip-brand { color: var(--c-purple); border-color: var(--c-purple); }
.sm-btn-primary { background: var(--c-blue); border-color: var(--c-blue); color: #FFFFFF; font-weight: 600; }
.sm-btn-primary:hover { background: var(--c-blue); opacity: .88; }
.sm-advice { background: var(--dsw-alias-bg-overlay); border: 1px solid var(--c-red); }
.sm-advice-action b { color: var(--c-red); }
.sm-advice-step-no { background: var(--c-red); }
@media (max-width: 720px) {
  .sm-root { padding: 0 16px 36px; }
  .sm-header { flex-direction: column; }
  .sm-toolbar { justify-content: flex-start; }
  .sm-hero-side { align-items: flex-start; text-align: left; }
  .sm-field-row { grid-template-columns: 1fr; }
}
`

    // ---------------------------------------------------------------------
    // Activation
    // ---------------------------------------------------------------------
    const inject = ['slots', 'locale', 'layout']

    function apply(ctx) {
      translate = ctx.locale.bind(NS)
      activeLocaleTag = () => {
        try {
          return ctx.locale.getLocale().active
        } catch {
          return undefined
        }
      }
      layoutService = ctx.layout
      ctx.effect(
        () => () => {
          if (toastTimer) {
            clearTimeout(toastTimer)
            toastTimer = null
          }
          if (aiSubmitTimer) {
            clearTimeout(aiSubmitTimer)
            aiSubmitTimer = null
          }
        },
        'self-management: timers',
      )
      ctx.effect(() => ctx.locale.register(NS, { zh, en }))
      ctx.effect(
        () => {
          const style = document.createElement('style')
          style.setAttribute('data-plugin', 'self-management')
          style.textContent = CSS
          document.head.appendChild(style)
          return () => style.remove()
        },
        'self-management: styles',
      )
      ctx.effect(() => {
        const onStorage = (event) => {
          if (event.key === STORAGE_KEY) invalidateFromStorage()
        }
        window.addEventListener('storage', onStorage)
        return () => window.removeEventListener('storage', onStorage)
      }, 'self-management: cross-tab sync')
      getData()

      ctx.slots.inject('main', () => ctx.slots.register({ name: 'main', key: PANEL_ID, locale: NS }, App))
      ctx.slots.inject('sidebar.panellist', () =>
        ctx.slots.register(
          { name: 'sidebar.panellist', id: PANEL_ID, order: 20, label: () => tt('app.title'), locale: NS },
          PanelIcon,
        ),
      )
      ctx.slots.inject('conversation.composer.dock', () =>
        ctx.slots.register(
          { name: 'conversation.composer.dock', id: 'self-management-dock', order: 20, locale: NS },
          Dock,
        ),
      )
    }

    exports.apply = apply
    exports.inject = inject
    return module.exports
  },
})
