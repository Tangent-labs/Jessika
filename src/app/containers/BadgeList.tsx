import { Badge } from '@/components/ui/badge';

export default function BadgeList({
    list,
}: {
    className?: string;
    list: string[];
}) {
    return list.map((item) => <Badge key={item}>{item}</Badge>);
}
