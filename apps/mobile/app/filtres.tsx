import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { formatNumber, tokens } from '@emd/shared';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { TextLink } from '@/components/Link';
import { NO_FILTERS, catalogQuery, useCatalog, type Filters } from '@/lib/catalog';

const toggle = (list: string[], id: string) =>
  list.includes(id) ? list.filter((x) => x !== id) : [...list, id];

// Feuille modale : catégories, marques, disponibilité. Le bouton affiche le nombre de produits du brouillon.
export default function Filtres() {
  const { filters, setFilters, categories, brands } = useCatalog();
  const [draft, setDraft] = useState<Filters>(filters);
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    catalogQuery(draft)
      .select('id')
      .range(0, 0)
      .then(({ count: n }) => !cancelled && setCount(n));
    return () => {
      cancelled = true;
    };
  }, [draft]);

  const topCategories = categories.filter((c) => !c.parent_id);
  const section = (title: string) => <Text variant="section">{title}</Text>;
  const wrap = { flexDirection: 'row', flexWrap: 'wrap', columnGap: 8 } as const;
  return (
    <Screen
      contentStyle={{ gap: 20, paddingTop: 24, paddingBottom: 16 }}
      footer={
        <Button
          label={
            count === null
              ? 'Afficher les produits'
              : `Afficher ${formatNumber(count)} produit${count > 1 ? 's' : ''}`
          }
          onPress={() => {
            setFilters(draft);
            router.back();
          }}
        />
      }
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text variant="modalTitle">Filtres</Text>
        <TextLink
          label="Réinitialiser"
          onPress={() => setDraft({ ...NO_FILTERS, query: draft.query })}
        />
      </View>
      {section('Catégories')}
      <View style={wrap}>
        {topCategories.map((c) => (
          <Chip
            key={c.id}
            label={c.name}
            selected={draft.categoryIds.includes(c.id)}
            onPress={() => setDraft({ ...draft, categoryIds: toggle(draft.categoryIds, c.id) })}
          />
        ))}
      </View>
      {section('Marques')}
      <View style={wrap}>
        {brands.map((b) => (
          <Chip
            key={b.id}
            label={b.name}
            selected={draft.brandIds.includes(b.id)}
            onPress={() => setDraft({ ...draft, brandIds: toggle(draft.brandIds, b.id) })}
          />
        ))}
      </View>
      {section('Disponibilité')}
      <View style={wrap}>
        <Chip
          label="Disponibles uniquement"
          selected={draft.availableOnly}
          onPress={() => setDraft({ ...draft, availableOnly: !draft.availableOnly })}
        />
      </View>
      <Text variant="caption" style={{ color: tokens.color.textSecondary }}>
        « Disponibles » exclut les produits en rupture.
      </Text>
    </Screen>
  );
}
