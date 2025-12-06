import type {
  Content,
  FunctionDeclaration,
  FunctionResponse,
  GenerateContentConfig,
  GoogleGenAI,
} from "@google/genai";
import type { GetManyItemsProps } from "../application/item-repository.interface.ts";

import { Type } from "@google/genai";
import { ItemService } from "../application/item.service.ts";

class ItemAiService {
  constructor(
    private readonly gemini: GoogleGenAI,
    private readonly service: ItemService,
  ) {}

  private getManyItemsFunctionDeclaration: FunctionDeclaration = {
    name: "getMany",
    description: "Get a list of items",
    parameters: {
      type: Type.OBJECT,
      properties: {
        limit: {
          type: Type.NUMBER,
          description: "The number of items per page",
        },
        search: {
          type: Type.STRING,
          description: "The search term to filter items by name",
        },
        page: {
          type: Type.NUMBER,
          description: "The page number to retrieve",
        },
        status: {
          type: Type.STRING,
          description:
            "The status of the items to filter by, e.g., 'active', 'inactive', 'archived'",
        },
        sort: {
          type: Type.STRING,
          description:
            "The field to sort by (e.g., 'id', 'name', 'price', 'created_at')",
        },
        order: {
          type: Type.STRING,
          description: "The sort order ('asc' or 'desc')",
        },
        withInventory: {
          type: Type.BOOLEAN,
          description:
            "Whether to include associated inventories in the response",
        },
      },
    },
  };

  async generate(spaceId: number, prompt: string) {
    const contents: Content[] = [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ];

    const config: GenerateContentConfig = {
      tools: [{ functionDeclarations: [this.getManyItemsFunctionDeclaration] }],
      temperature: 0,
      systemInstruction: `
        **Role:**
        You are a helpful and professional ERP Inventory Assistant. Your goal is to help non-technical users find product information quickly and easily.

        **Tone and Style:**
        Your responses must be natural, conversational, and business-friendly.
        **Strict Prohibition:** Do not mention function names (like getMany), parameter names (like withInventory or limit), variable names (like created_at), or internal database logic in your final response to the user. Never show JSON objects or raw code.

        **Function Usage and Data Processing:**

        1.  **Retrieving Data:**
            You must use the provided tool to fetch data.
            *   **Stock Checks:** If the user asks about stock, quantity, or availability (e.g., "How many do we have?"), you must set the parameter withInventory to true.
            *   **Search:** Map user keywords to the search parameter.
            *   **Sorting:** Interpret "Newest" as sorting by created_at (descending) and "Cheapest" as sorting by price (ascending).
            *   **Status:** Only filter by status if the user specifically asks (e.g., "Show me active items").

        2.  **Calculating Stock (Internal Process):**
            When you request inventory data, the system will return a list of inventory records for each item. You must calculate the total internally.
            *   Step 1: Look at the inventory array for the item.
            *   Step 2: Add up the numbers found in the balance field of every inventory record.
            *   Step 3: The result is the Total Stock.
            *   **Important:** Do not explain this math to the user. Just present the final number.

        **Response Guidelines:**

        1.  **Keep it clean:** Instead of saying "I have fetched the items with limit 10," say "Here are the items you requested:"
        2.  **Formatting:** Use clean bullet points or simple lists.
        3.  **Presenting Stock:** If you calculated the stock, label it simply as "Total Stock" or "Quantity on Hand" followed by the number.
        4.  **Zero Results:** If no items are found, say "I couldn't find any products matching that description. Would you like to try a different search?" rather than "The array returned empty."

        **Examples of Good vs. Bad Responses:**

        *   **Bad (Too Technical):** I executed getMany with search='Apples' and withInventory=true. The item has an inventory array with balances 10 and 5.
        *   **Good (Natural):** I found the Apples you were looking for. Currently, we have a Total Stock of 15 units.

        **Clarification Protocols:**
        If a user is vague (e.g., "Show me the item"), ask a clarifying question naturally: "Could you tell me which specific item you are looking for? Or I can show you the most recent additions."
      `,
    };

    let finalResponse: string | undefined;
    let count = 0;

    while (true) {
      if (count >= 5) {
        throw new Error("Too many AI Request");
      }

      const response = await this.gemini.models.generateContent({
        model: "gemini-2.5-flash-lite",
        contents,
        config,
      });

      if (response.functionCalls && response.functionCalls.length > 0) {
        for (const functionCall of response.functionCalls) {
          if (functionCall.name === "getMany") {
            const args = functionCall.args as GetManyItemsProps;
            const items = await this.service.getMany({
              ...args,
              spaceId,
              type: "full",
            });

            const functionResponse: FunctionResponse = {
              name: functionCall.name,
              response: { result: items },
            };

            contents.push({
              role: "model",
              parts: [{ functionCall }],
            });

            contents.push({ role: "user", parts: [{ functionResponse }] });
          }
        }

        count++;
      } else {
        if (!response.text) {
          throw new Error("Failed to generate content");
        }
        finalResponse = response.text;
        break;
      }
    }

    return finalResponse;
  }
}

export { ItemAiService };
