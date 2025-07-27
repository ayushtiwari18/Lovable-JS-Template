import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatOrderItems } from "../orderUtils/OrderUtils.js";

export function OrderDetailsItems({ items, customizationDetails }) {
  console.log("OrderDetailsItems received items:", items);
  console.log(
    "OrderDetailsItems received customizationDetails:",
    customizationDetails
  );

  if (!Array.isArray(items)) {
    return (
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Order Items</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Invalid items data format
          </p>
        </CardContent>
      </Card>
    );
  }

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

  // Parse customization_details if it's a string
  let customizationObj = {};
  if (typeof customizationDetails === "string") {
    try {
      customizationObj = JSON.parse(customizationDetails);
    } catch (e) {
      console.error("Invalid customizationDetails JSON", e);
      customizationObj = {};
    }
  } else if (
    typeof customizationDetails === "object" &&
    customizationDetails !== null
  ) {
    customizationObj = customizationDetails;
  }

  // Debug: Show available customization keys
  console.log("Available customization keys:", Object.keys(customizationObj));

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="text-base sm:text-lg">Order Items</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {formatted.data.map((item, index) => {
            console.log(`Processing item ${index}:`, item);

            // Try multiple productId fields to find a match
            const possibleProductIds = [
              item.productId,
              item.id,
              item.product_id,
              item.variantId,
              item.variant_id,
            ].filter(Boolean);

            console.log(
              `Item ${index} possible productIds:`,
              possibleProductIds
            );

            // Find the first matching customization
            let customizationDetail = null;
            let matchedProductId = null;

            for (const pid of possibleProductIds) {
              if (customizationObj[pid]) {
                customizationDetail = customizationObj[pid];
                matchedProductId = pid;
                break;
              }
            }

            // If no direct match, try to find any customization (for single item orders)
            if (
              !customizationDetail &&
              Object.keys(customizationObj).length === 1
            ) {
              const onlyKey = Object.keys(customizationObj)[0];
              customizationDetail = customizationObj[onlyKey];
              matchedProductId = onlyKey;
              console.log(
                `Item ${index} using only available customization key:`,
                onlyKey
              );
            }

            console.log(`Item ${index} matched productId:`, matchedProductId);
            console.log(
              `Item ${index} customizationDetail:`,
              customizationDetail
            );

            // Extract customization data from customization_details
            const customizations = customizationDetail?.customizations || {};

            const customText = customizations.text
              ? customizations.text.trim()
              : "";
            const customSize = customizations.size
              ? customizations.size.trim()
              : "";
            const customColor = customizations.color
              ? customizations.color.trim()
              : "";
            const customUploadedImage = customizations.uploadedImage || null;
            const productTitle = customizationDetail?.productTitle
              ? customizationDetail.productTitle.trim()
              : "";

            console.log(`Item ${index} extracted customization:`, {
              customText,
              customSize,
              customColor,
              hasImage: !!customUploadedImage?.url,
              productTitle,
            });

            // Check if there's ANY meaningful customization data
            const hasAnyCustomizationData =
              customText !== "" ||
              customSize !== "" ||
              customColor !== "" ||
              (customUploadedImage &&
                customUploadedImage.url &&
                customUploadedImage.url.trim() !== "") ||
              productTitle !== "";

            console.log(
              `Item ${index} has customization data:`,
              hasAnyCustomizationData
            );

            return (
              <div
                key={item.id}
                className="border rounded-lg p-3 sm:p-4 bg-muted/30"
              >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 space-y-2 sm:space-y-0">
                  <h4 className="font-medium text-sm sm:text-base break-words">
                    {item.name}
                  </h4>
                  <Badge variant="outline" className="self-start">
                    ₹{item.price || 0}
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

                  {/* Show size from variant or custom size */}
                  {(customSize !== "" || item.variant?.size || item.size) && (
                    <div>
                      <span className="font-medium">Size:</span>{" "}
                      {customSize !== ""
                        ? customSize
                        : item.variant?.size || item.size}
                    </div>
                  )}

                  {/* Show color from custom or item */}
                  {(customColor !== "" || item.color) && (
                    <div>
                      <span className="font-medium">Color:</span>{" "}
                      {customColor !== "" ? customColor : item.color}
                    </div>
                  )}

                  {item.variant?.weight && (
                    <div>
                      <span className="font-medium">Weight:</span>{" "}
                      {item.variant.weight}
                    </div>
                  )}

                  {item.material && (
                    <div>
                      <span className="font-medium">Material:</span>{" "}
                      {item.material}
                    </div>
                  )}

                  {/* Show variant ID if available */}
                  {customizationDetail?.variantId && (
                    <div>
                      <span className="font-medium">Variant:</span>{" "}
                      {customizationDetail.variantId.slice(0, 8)}...
                    </div>
                  )}
                </div>

                {/* Show customization section if there's actual meaningful data */}
                {hasAnyCustomizationData && (
                  <div className="mt-2 p-2 bg-green-50 rounded text-sm">
                    <div className="font-medium text-green-800 mb-2">
                      Customization Details:
                    </div>

                    <div className="space-y-2">
                      {customText !== "" && (
                        <div>
                          <span className="font-medium">Text:</span>{" "}
                          <span className="break-words">{customText}</span>
                        </div>
                      )}

                      {customSize !== "" && (
                        <div>
                          <span className="font-medium">Custom Size:</span>{" "}
                          {customSize}
                        </div>
                      )}

                      {customColor !== "" && (
                        <div>
                          <span className="font-medium">Custom Color:</span>{" "}
                          {customColor}
                        </div>
                      )}

                      {productTitle !== "" && (
                        <div>
                          <span className="font-medium">Product:</span>{" "}
                          <span className="break-words">{productTitle}</span>
                        </div>
                      )}

                      {customUploadedImage?.url && (
                        <div>
                          <div className="font-medium mb-1">
                            Uploaded Image:
                          </div>
                          <img
                            src={customUploadedImage.url}
                            alt={customUploadedImage.fileName || "Custom Image"}
                            className="max-w-full h-auto rounded shadow border"
                            style={{ maxHeight: "200px" }}
                            onError={(e) => {
                              console.error(
                                "Failed to load image:",
                                customUploadedImage.url
                              );
                              e.target.style.display = "none";
                            }}
                          />
                          {customUploadedImage.fileName && (
                            <p className="text-xs text-muted-foreground mt-1">
                              File: {customUploadedImage.fileName}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Show timestamp when customization was made */}
                      {customizationDetail?.timestamp && (
                        <div className="text-xs text-muted-foreground pt-1 border-t">
                          Customized:{" "}
                          {new Date(
                            customizationDetail.timestamp
                          ).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Debug info - remove after fixing */}
                {!hasAnyCustomizationData && customizationDetail && (
                  <div className="mt-2 p-2 bg-yellow-50 rounded text-xs text-yellow-700">
                    Debug: Customization found but no meaningful data extracted
                  </div>
                )}

                {!customizationDetail &&
                  Object.keys(customizationObj).length > 0 && (
                    <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-700">
                      Debug: No matching customization found. Item IDs:{" "}
                      {possibleProductIds.join(", ")}
                    </div>
                  )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
