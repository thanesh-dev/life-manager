import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { LoginComponent } from './auth/login.component';
import { ShellComponent } from './shell/shell.component';
import { FitnessComponent } from './fitness/fitness.component';
import { FinanceComponent } from './finance/finance.component';
import { LearningComponent } from './learning/learning.component';
import { GoalsComponent } from './goals/goals.component';
import { InsightsComponent } from './insights/insights.component';
import { FoodComponent } from './food/food.component';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    {
        path: 'dashboard',
        component: ShellComponent,
        canActivate: [authGuard],
        children: [
            { path: '', redirectTo: 'fitness', pathMatch: 'full' },
            { path: 'fitness', component: FitnessComponent },
            { path: 'finance', component: FinanceComponent },
            { path: 'learning', component: LearningComponent },
            { path: 'goals', component: GoalsComponent },
            { path: 'insights', component: InsightsComponent },
            { path: 'food', component: FoodComponent },
        ],
    },
    { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
    { path: '**', redirectTo: '/dashboard' },
];
