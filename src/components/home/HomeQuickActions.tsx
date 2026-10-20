import { AondeIrButton } from './AondeIrButton';
import { ChameAquiButton } from './ChameAquiButton';

export const HomeQuickActions = () => (
  <div className="grid grid-cols-2 gap-2 sm:gap-3">
    <AondeIrButton />
    <ChameAquiButton />
  </div>
);
