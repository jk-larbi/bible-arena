import React from 'react';
import { ProfileView } from '../profile/ProfileView';

interface MyProgressViewProps {
  onExploreQuizzes: () => void;
  onHostArena?: () => void;
}

export const MyProgressView: React.FC<MyProgressViewProps> = (props) => {
  return <ProfileView {...props} />;
};
