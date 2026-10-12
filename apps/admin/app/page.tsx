import { redirect } from 'next/navigation';

// Le tableau de bord arrive au lot 6.
export default function Home() {
  redirect('/clients');
}
