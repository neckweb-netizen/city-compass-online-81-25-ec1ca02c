
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminEmpresaStories } from '@/hooks/useEmpresaStories';
import { SystemStoryForm } from '@/components/admin/forms/SystemStoryForm';
import { StoryManagement } from './StoryManagement';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';

export const EmpresaStoriesSection = () => {
  const { 
    stories, 
    loading, 
    createStory, 
    updateStory, 
    deleteStory 
  } = useAdminEmpresaStories();

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Gerenciar Stories dos Locais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="space-y-2">
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-32 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Gerenciar Stories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 mb-6">
            <p className="text-sm text-muted-foreground">
              Gerencie stories dos locais e stories do sistema. Você pode criar stories personalizados 
              com perfis customizados ou gerenciar stories criados pelos locais.
            </p>
            
            <div className="flex justify-start">
              <SystemStoryForm onCreateStory={createStory} />
            </div>
          </div>
          
          <StoryManagement
            stories={stories}
            onUpdateStory={updateStory}
            onDeleteStory={deleteStory}
          />
        </CardContent>
      </Card>
    </div>
  );
};
