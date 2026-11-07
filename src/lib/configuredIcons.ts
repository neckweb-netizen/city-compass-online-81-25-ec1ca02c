// Explicit imports preserve tree shaking. A namespace import forces
// the entire icon catalog into JavaScript downloaded on mobile.
import {
  BarChart3, Briefcase, Building2, Bus, Calendar, ChevronLeft,
  Construction, Gamepad2, Gift, Grid3X3, HeartHandshake, HelpCircle,
  Home, Landmark, Leaf, Lightbulb, Megaphone, MessageCircle,
  MessageSquare, MoreHorizontal, Radio, Search, Shield, Sprout,
  Tags, Ticket, TrafficCone, Trash2, User, Wrench,
} from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';

type MenuIcon = ComponentType<SVGProps<SVGSVGElement>>;

// Include icons hard-coded in menus and configured in menu_configuracoes
// and categorias_problema. Unknown names use a safe fallback.
const icons = {
  BarChart3, Briefcase, Building2, Bus, Calendar, ChevronLeft,
  Construction, Gamepad2, Gift, Grid3X3, HeartHandshake, HelpCircle,
  Home, Landmark, Leaf, Lightbulb, Megaphone, MessageCircle,
  MessageSquare, MoreHorizontal, Radio, Search, Shield, Sprout,
  Tags, Ticket, TrafficCone, Trash2, User, Wrench,
} satisfies Record<string, MenuIcon>;

export function getConfiguredIcon(name: string | null | undefined): MenuIcon {
  if (name && Object.prototype.hasOwnProperty.call(icons, name)) {
    return icons[name as keyof typeof icons];
  }
  return HelpCircle;
}

export { ChevronLeft };
