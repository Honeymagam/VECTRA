import {
  AlertTriangle,
  Bot,
  BrainCircuit,
  Calculator,
  CalendarClock,
  ChartLine,
  Database,
  FileBarChart,
  FileSearch,
  Gauge,
  LayoutDashboard,
  Network,
  RefreshCw,
  Settings,
  SlidersHorizontal,
  Timer,
  UserRound,
  Workflow,
  type LucideIcon,
} from 'lucide-react';

export interface AppRoute {
  path: string;
  label: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

export interface NavSection {
  id: string;
  title: string;
  items: AppRoute[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    id: 'overview',
    title: 'Overview',
    items: [
      {
        path: '/dashboard',
        label: 'Dashboard',
        title: 'Dashboard',
        description: 'Your learning progress, readiness and revision priorities at a glance.',
        icon: LayoutDashboard,
      },
      {
        path: '/framework',
        label: 'Framework Overview',
        title: 'Framework Overview',
        description: 'How the layers of the VECTRA placement intelligence framework connect as one system.',
        icon: Workflow,
      },
    ],
  },
  {
    id: 'core-intelligence',
    title: 'Core Intelligence',
    items: [
      {
        path: '/knowledge-extraction',
        label: 'Knowledge Extraction',
        title: 'Knowledge Extraction',
        description: 'Manage learning resources and track how each one is processed into structured knowledge.',
        icon: FileSearch,
      },
      {
        path: '/vector-memory',
        label: 'Vector Memory Bank',
        title: 'Vector Memory Bank',
        description: 'Indexed resources and embeddings stored for semantic retrieval with pgvector.',
        icon: Database,
      },
      {
        path: '/dataset-review',
        label: 'Dataset Review',
        title: 'Dataset Review',
        description: 'Inspect actual records and formulas from the latest uploaded CSV.',
        icon: FileBarChart,
      },
      {
        path: '/formulas',
        label: 'Formula Library',
        title: 'Formula Library',
        description: 'Review formula patterns and examples sourced from your uploaded dataset.',
        icon: Calculator,
      },
      {
        path: '/concept-graph',
        label: 'Concept Memory Graph',
        title: 'Concept Memory Graph',
        description: 'Explore concepts, their related topics and the prerequisites that connect them.',
        icon: Network,
      },
      {
        path: '/reasoning-core',
        label: 'Cognitive Reasoning Core',
        title: 'Cognitive Reasoning Core',
        description: 'Retrieval-augmented reasoning that grounds every answer in your learning resources.',
        icon: BrainCircuit,
      },
    ],
  },
  {
    id: 'learning-intelligence',
    title: 'Learning Intelligence',
    items: [
      {
        path: '/ai-tutor',
        label: 'AI Tutor',
        title: 'AI Tutor',
        description: 'Ask aptitude questions and get context-aware explanations, hints and formulas.',
        icon: Bot,
      },
      {
        path: '/mistake-analysis',
        label: 'Mistake Analysis',
        title: 'Mistake Analysis',
        description: 'Understand where your reasoning breaks down and which concepts need attention.',
        icon: AlertTriangle,
      },
      {
        path: '/feedback-loop',
        label: 'Cognitive Feedback Loop',
        title: 'Cognitive Feedback Loop',
        description: 'The cycle from your response to analysis, learner-state update and next recommendation.',
        icon: RefreshCw,
      },
      {
        path: '/revision',
        label: 'Revision Intelligence',
        title: 'Revision Intelligence',
        description: 'Weak-concept identification, personalised revision plans and scheduled tasks.',
        icon: CalendarClock,
      },
    ],
  },
  {
    id: 'assessment',
    title: 'Assessment',
    items: [
      {
        path: '/practice',
        label: 'Adaptive Practice',
        title: 'Adaptive Practice',
        description: 'Practise by topic and difficulty, then review explanations and performance.',
        icon: SlidersHorizontal,
      },
      {
        path: '/mock-tests',
        label: 'Mock Tests',
        title: 'Mock Tests',
        description: 'Timed placement-style tests with question navigation and result summaries.',
        icon: Timer,
      },
      {
        path: '/readiness',
        label: 'Placement Readiness',
        title: 'Placement Readiness',
        description: 'Accuracy, speed, concept mastery, mistake recovery and revision consistency in one view.',
        icon: Gauge,
      },
    ],
  },
  {
    id: 'insights',
    title: 'Insights',
    items: [
      {
        path: '/analytics',
        label: 'Learning Analytics',
        title: 'Learning Analytics',
        description: 'Trends in accuracy, practice performance, time spent and concept mastery.',
        icon: ChartLine,
      },
      {
        path: '/reports',
        label: 'Reports',
        title: 'Reports',
        description: 'Performance summaries, assessment reports and exports.',
        icon: FileBarChart,
      },
    ],
  },
  {
    id: 'account',
    title: 'Account',
    items: [
      {
        path: '/settings',
        label: 'Settings',
        title: 'Settings',
        description: 'Account preferences, learning preferences, notifications and security.',
        icon: Settings,
      },
      {
        path: '/profile',
        label: 'Profile',
        title: 'Student Profile',
        description: 'Your personal details and academic goals.',
        icon: UserRound,
      },
    ],
  },
];

export const ROUTES: AppRoute[] = NAV_SECTIONS.flatMap((section) => section.items);

export const DEFAULT_ROUTE_PATH = '/dashboard';

export function findRouteContext(pathname: string) {
  for (const section of NAV_SECTIONS) {
    const route = section.items.find((item) => item.path === pathname);
    if (route) return { section, route };
  }
  return null;
}
