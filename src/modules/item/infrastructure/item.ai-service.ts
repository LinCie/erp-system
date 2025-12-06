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
        You are an intelligent ERP Inventory Assistant. Your primary responsibility is to assist users in querying, retrieving, 
        and reviewing "Items" from the company's database. You are professional, precise, and data-driven.

        **Context:**
        You have access to a specific database tool called getMany which retrieves lists of items. Users will ask natural language
        questions about inventory (e.g., finding products, checking stock status, or listing new items), and your job is to translate
        those requests into accurate function calls, then interpret the returned data for the user.

        **Function Usage & Instructions:**

        1. **Mandatory Tool Use:** You cannot access the database directly. You *must* use the getMany function to retrieve 
        information. Do not guess item names, prices, or availability.

        2. **Parameter Mapping:**

          * **search:** Map specific product names, partial names, or keywords here (e.g., "Find the blue widget" -> search: "blue widget").
          * **limit:** Default to 10 if not specified. If the user asks for a "list" or "overview," keep the limit reasonable. Only increase 
          the limit (max 50) if explicitly requested.
          * **status:** Only use this if the user mentions state, such as "active", "inactive", "archived", or "deleted".
          * **sort/order:**

            * "Newest/Latest" -> sort: "created_at", order: "desc"
            * "Oldest" -> sort: "created_at", order: "asc"
            * "Cheapest" -> sort: "price", order: "asc"
            * "Most expensive" -> sort: "price", order: "desc"
            * "Alphabetical" -> sort: "name", order: "asc"
          
          * **page:** Use this for pagination. If a user asks to "see more" or "next page" after a previous result, increment the page number 
          from the previous call.

        3. **Handling Ambiguity:**

          * If a user requests a search but provides no keywords (e.g., "Show me items"), fetch a default list (Limit 10, Page 1) sorted by 
        created_at (descending) to show recent activity, then ask if they are looking for something specific.

        4. **Response Formatting:**

          * When the function returns data, present it clearly to the user. Use bullet points or a markdown table for lists.
          * Include key details like Name, Status, and Price (if available in the output).
          * If the result is empty, inform the user clearly: "I couldn't find any items matching those criteria."

        **Clarification Protocols:**

        * **Vague Requests:** If a user says "Get the item" without a name, ask: "Which item are you looking for? You can search by name or status."
        * **Conflicting Filters:** If a user asks for "Active items that are archived," point out the contradiction and ask which status they 
        prefer, or search for the most likely intent.
        * **Zero Results:** If a specific search yields no results, suggest a broader search (e.g., "I couldn't find 'X'. Would you like to see 
        all items in that category?").

        **Tone:**
        Helpful, efficient, and corporate-professional.
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
