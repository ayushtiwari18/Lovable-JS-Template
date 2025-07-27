import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatOrderItems } from "../orderUtils/OrderUtils.js";

export function OrderDetailsItems({ items }) {
  const formatted = formatOrderItems(items);

  if (
    formatted.component === "NoItems" ||
    formatted.component === "InvalidItems"
  ) {
    return (
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Order Items</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{formatted.message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="text-base sm:text-lg">Order Items</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {formatted.data.map((item) => (
            <div
              key={item.id}
              className="border rounded-lg p-3 sm:p-4 bg-muted/30"
            >
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 space-y-2 sm:space-y-0">
                <h4 className="font-medium text-sm sm:text-base break-words">
                  {item.name}
                </h4>
                <Badge variant="outline" className="self-start">
                  ₹{item.price}
                </Badge>
              </div>

              {item.description && (
                <p className="text-sm text-muted-foreground mb-2 break-words">
                  {item.description}
                </p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-sm">
                {item.quantity !== undefined && (
                  <div>
                    <span className="font-medium">Quantity:</span>{" "}
                    {item.quantity}
                  </div>
                )}
                {item.size && (
                  <div>
                    <span className="font-medium">Size:</span> {item.size}
                  </div>
                )}
                {item.color && (
                  <div>
                    <span className="font-medium">Color:</span> {item.color}
                  </div>
                )}
                {item.material && (
                  <div>
                    <span className="font-medium">Material:</span>{" "}
                    {item.material}
                  </div>
                )}
              </div>

              {item.customization && (
                <div className="mt-2 p-2 bg-blue-50 rounded text-sm break-words">
                  <span className="font-medium">Customization:</span>{" "}
                  {item.customization}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
