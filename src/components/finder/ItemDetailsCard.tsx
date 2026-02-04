import { Card, CardContent } from "@/components/ui/card";
import type { ItemInfo } from "@/types";

interface ItemDetailDisplay {
  type: string;
  value: string;
}

interface ItemDetailsCardProps {
  item: ItemInfo | null;
  itemDetails: ItemDetailDisplay[];
}

/**
 * Card component displaying item details for the finder.
 * Excludes "Item owner name" from display and shows description if present.
 */
export function ItemDetailsCard({ item, itemDetails }: ItemDetailsCardProps) {
  const filteredDetails = itemDetails.filter((d) => d.type !== "Item owner name");
  const hasDetails = filteredDetails.length > 0;
  const hasDescription = !!item?.description;

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <h2 className="font-semibold text-lg mb-4">Item Details:</h2>

        {hasDetails && (
          <div className="space-y-3">
            {filteredDetails.map((detail, index) => (
              <div key={index}>
                <span className="font-medium">{detail.type}:</span>{" "}
                <span className="text-muted-foreground">{detail.value}</span>
              </div>
            ))}
          </div>
        )}

        {hasDescription && (
          <div className="mt-4">
            <h3 className="font-semibold mb-1">Additional Details:</h3>
            <p className="text-muted-foreground">{item.description}</p>
          </div>
        )}

        {!hasDetails && !hasDescription && (
          <p className="text-muted-foreground">No additional details provided.</p>
        )}
      </CardContent>
    </Card>
  );
}
