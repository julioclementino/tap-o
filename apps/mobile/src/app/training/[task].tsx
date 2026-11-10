import { useLocalSearchParams, router } from 'expo-router';
import { tutorials } from '@tap-o/core';
import { TrainingScreen } from '../../features/training/TrainingScreen';
import { Button, Screen, T } from '../../components/ui';
export default function TrainingRoute() {
  const { task, independent, run } = useLocalSearchParams<{
    task: string;
    independent?: string;
    run?: string;
  }>();
  if (!tutorials.some((t) => t.id === task))
    return (
      <Screen title="Vamos escolher uma atividade">
        <T>Esta tarefa não está disponível.</T>
        <Button label="Ver atividades" onPress={() => router.replace('/practice')} />
      </Screen>
    );
  return (
    <TrainingScreen
      key={`${task}-${independent}-${run}`}
      taskId={task}
      independent={independent === '1'}
    />
  );
}
