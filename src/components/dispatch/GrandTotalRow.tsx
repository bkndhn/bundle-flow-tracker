
import React from 'react';

interface GrandTotalRowProps {
  bigShopShirt: number;
  bigShopPant: number;
  smallShopShirt: number;
  smallShopPant: number;
}

export function GrandTotalRow({ 
  bigShopShirt, 
  bigShopPant, 
  smallShopShirt, 
  smallShopPant 
}: GrandTotalRowProps) {
  const bigShopTotal = bigShopShirt + bigShopPant;
  const smallShopTotal = smallShopShirt + smallShopPant;

  return (
    <div className="grid grid-cols-3 gap-4 py-3 border-t-2 border-gray-300 bg-gray-50/80 font-semibold">
      <div className="text-gray-800">Total</div>
      <div className="text-center text-blue-600">{bigShopTotal}</div>
      <div className="text-center text-green-600">{smallShopTotal}</div>
    </div>
  );
}
