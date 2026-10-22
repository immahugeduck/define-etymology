import { $ as parseProviderOptions, A as deleteFromApi, At as any, Bt as number, C as createJsonErrorResponseHandler, Ct as NoSuchModelError, D as createProviderExecutedToolFactory, Dt as _enum, E as createNullLanguageModelUsage, Ft as json, Gt as union, Ht as record, J as lazySchema, Kt as unknown, L as generateId, Lt as literal, M as encodePathSegment, Mt as boolean, O as createProviderStreamError, P as extractResponseHeaders, Pt as discriminatedUnion, Q as normalizeBatchRequestCounts, R as getFromApi, Rt as looseObject, T as createLanguageModelResponseMetadata, Tt as UnsupportedFunctionalityError, U as isCustomReasoning, Ut as string, V as getTopLevelMediaType, Vt as object, Wt as tuple, X as mapReasoningToProviderEffort, Y as loadApiKey, Z as mediaTypeToExtension, _ as convertToBase64, _t as WORKFLOW_DESERIALIZE, at as resolveFullMediaType, b as createBinaryStreamResponseHandler, bt as APICallError, ct as safeParseJSON, d as combineHeaders, dt as toWebSocketUrl, et as postFormDataToApi, f as connectToWebSocket, ft as validateTypes, g as convertInlineFileDataToUint8Array, gt as zodSchema, h as convertImageModelFileToDataUri, ht as withoutTrailingSlash, it as resolve, jt as array, k as createStatusCodeErrorResponseHandler, lt as safeValidateTypes, m as convertBase64ToUint8Array, mt as withUserAgentSuffix, nt as postMultipartStreamToApi, ot as resolveProviderReference, p as convertAsyncIteratorToReadableStream, pt as waitForWebSocketBufferDrain, tt as postJsonToApi, ut as serializeModelOptions, v as convertUint8ArrayToBase64, vt as WORKFLOW_SERIALIZE, w as createJsonResponseHandler, x as createEventSourceResponseHandler, xt as InvalidArgumentError, y as createBinaryResponseHandler, yt as AISDKError } from "./@ai-sdk/gateway+[...].mjs";
//#region node_modules/@ai-sdk/xai/dist/index.js
var apiErrorSchema = () => object({ error: object({
	message: string(),
	type: string().nullish(),
	param: any().nullish(),
	code: union([string(), number()]).nullish()
}) });
var responsesErrorSchema = () => object({
	code: string(),
	error: string()
});
var speechErrorSchema = () => object({ error: string() });
var xaiErrorDataSchema = lazySchema(() => zodSchema(union([
	apiErrorSchema(),
	responsesErrorSchema(),
	speechErrorSchema()
])));
var xaiFailedResponseHandler = createJsonErrorResponseHandler({
	errorSchema: xaiErrorDataSchema,
	errorToMessage: (data) => {
		if (typeof data.error === "string") return "code" in data ? `${data.code}: ${data.error}` : data.error;
		return data.error.message;
	}
});
var xaiImageModelOptions = lazySchema(() => zodSchema(object({
	aspect_ratio: string().optional(),
	output_format: string().optional(),
	sync_mode: boolean().optional(),
	resolution: _enum([
		"1k",
		"1.5k",
		"2k"
	]).optional(),
	quality: _enum([
		"low",
		"medium",
		"high",
		"auto"
	]).optional(),
	user: string().optional()
})));
var fileInputModelIds = /* @__PURE__ */ new Set([
	"grok-imagine-image",
	"grok-imagine-image-2.0",
	"grok-imagine-image-pro"
]);
var XaiImageModel = class XaiImageModel {
	get supportsFileInputs() {
		return fileInputModelIds.has(this.modelId) ? true : void 0;
	}
	get supportsMaskInputs() {
		return this.supportsFileInputs === true ? false : void 0;
	}
	get provider() {
		return this.config.provider;
	}
	static [WORKFLOW_SERIALIZE](model) {
		return serializeModelOptions({
			modelId: model.modelId,
			config: model.config
		});
	}
	static [WORKFLOW_DESERIALIZE](options) {
		return new XaiImageModel(options.modelId, options.config);
	}
	constructor(modelId, config) {
		this.modelId = modelId;
		this.config = config;
		this.specificationVersion = "v4";
		this.maxImagesPerCall = 3;
	}
	async doGenerate({ prompt, n, size, aspectRatio, seed, providerOptions, headers, abortSignal, files, mask }) {
		const warnings = [];
		if (size != null) warnings.push({
			type: "unsupported",
			feature: "size",
			details: "This model does not support the `size` option. Use `aspectRatio` instead."
		});
		if (seed != null) warnings.push({
			type: "unsupported",
			feature: "seed"
		});
		if (mask != null) warnings.push({
			type: "unsupported",
			feature: "mask"
		});
		const xaiOptions = await parseProviderOptions({
			provider: "xai",
			providerOptions,
			schema: xaiImageModelOptions
		});
		const hasFiles = files != null && files.length > 0;
		const imageUrls = hasFiles ? files.map((file) => convertImageModelFileToDataUri(file)) : [];
		const endpoint = hasFiles ? "/images/edits" : "/images/generations";
		const body = {
			model: this.modelId,
			prompt,
			n,
			response_format: "b64_json"
		};
		if (aspectRatio != null) body.aspect_ratio = aspectRatio;
		if (xaiOptions?.output_format != null) body.output_format = xaiOptions.output_format;
		if (xaiOptions?.sync_mode != null) body.sync_mode = xaiOptions.sync_mode;
		if (xaiOptions?.aspect_ratio != null && aspectRatio == null) body.aspect_ratio = xaiOptions.aspect_ratio;
		if (xaiOptions?.resolution != null) body.resolution = xaiOptions.resolution;
		if (xaiOptions?.quality != null) body.quality = xaiOptions.quality;
		if (xaiOptions?.user != null) body.user = xaiOptions.user;
		if (imageUrls.length === 1) body.image = {
			url: imageUrls[0],
			type: "image_url"
		};
		else if (imageUrls.length > 1) body.images = imageUrls.map((url) => ({
			url,
			type: "image_url"
		}));
		const baseURL = this.config.baseURL ?? "https://api.x.ai/v1";
		const currentDate = this.config._internal?.currentDate?.() ?? /* @__PURE__ */ new Date();
		const { value: response, responseHeaders } = await postJsonToApi({
			url: `${baseURL}${endpoint}`,
			headers: combineHeaders(this.config.headers?.(), headers),
			body,
			failedResponseHandler: xaiFailedResponseHandler,
			successfulResponseHandler: createJsonResponseHandler(xaiImageResponseSchema),
			abortSignal,
			fetch: this.config.fetch
		});
		if (response.data.some((image) => image.respect_moderation === false)) throw new Error("Image generation was blocked due to a content policy violation.");
		return {
			images: response.data.every((image) => image.b64_json != null) ? response.data.map((image) => image.b64_json) : await Promise.all(response.data.map((image) => this.downloadImage(image.url, abortSignal))),
			warnings,
			response: {
				timestamp: currentDate,
				modelId: this.modelId,
				headers: responseHeaders
			},
			providerMetadata: { xai: {
				images: response.data.map((item) => ({ ...item.revised_prompt ? { revisedPrompt: item.revised_prompt } : {} })),
				...response.usage?.cost_in_usd_ticks != null ? { costInUsdTicks: response.usage.cost_in_usd_ticks } : {}
			} }
		};
	}
	async downloadImage(url, abortSignal) {
		const { value } = await getFromApi({
			url,
			validateUrl: true,
			trustedOrigin: this.config.baseURL,
			abortSignal,
			failedResponseHandler: createStatusCodeErrorResponseHandler(),
			successfulResponseHandler: createBinaryResponseHandler(),
			fetch: this.config.fetch
		});
		return value;
	}
};
var xaiImageResponseSchema = lazySchema(() => zodSchema(object({
	data: array(object({
		url: string().nullish(),
		b64_json: string().nullish(),
		revised_prompt: string().nullish(),
		respect_moderation: boolean().nullish()
	})),
	usage: object({ cost_in_usd_ticks: number().nullish() }).nullish()
})));
function getResponseMetadata({ id, model, created, created_at }) {
	return createLanguageModelResponseMetadata({
		id,
		model,
		created: created ?? created_at
	});
}
function mapXaiFinishReason(finishReason) {
	switch (finishReason) {
		case "stop": return "stop";
		case "length": return "length";
		case "tool_calls":
		case "function_call": return "tool-calls";
		case "content_filter": return "content-filter";
		default: return "other";
	}
}
var xaiFilesResponseSchema = lazySchema(() => zodSchema(object({
	id: string(),
	object: string().nullish(),
	bytes: number().nullish(),
	created_at: number().nullish(),
	expires_at: number().nullish(),
	filename: string().nullish(),
	purpose: string().nullish(),
	status: string().nullish()
})));
var xaiFileDeleteResponseSchema = lazySchema(() => zodSchema(object({
	id: string(),
	object: string().nullish(),
	deleted: boolean()
})));
/**
* The grok-4.20 reasoning and non-reasoning models (including dated variants
* such as `grok-4.20-0309-reasoning`) reject the reasoning effort parameter
* with an invalid-argument error for every value, including `none`.
* Other models such as `grok-4.3`, `grok-latest`, and
* `grok-4.20-multi-agent` accept it.
*/
var modelsWithoutReasoningEffort = /^grok-4\.20(-\d{4})?-(non-)?reasoning$/;
function supportsReasoningEffort(modelId) {
	return !modelsWithoutReasoningEffort.test(modelId);
}
var xaiFilePartProviderOptions = lazySchema(() => zodSchema(object({ 
/**
* Controls the resolution at which the model processes the image.
* `low` processes the image at reduced resolution and consumes fewer
* input tokens, `high` processes the image at full resolution, and
* `auto` lets the API decide. Defaults to full resolution when not set.
*
* Note: the xAI API silently ignores invalid values, so the value is
* validated client-side.
*
* @see https://docs.x.ai/developers/model-capabilities/images/understanding
*/
imageDetail: _enum([
	"low",
	"high",
	"auto"
]).optional() })));
async function convertToXaiResponsesInput({ prompt }) {
	const input = [];
	const inputWarnings = [];
	for (const message of prompt) switch (message.role) {
		case "system":
			input.push({
				role: "system",
				content: message.content
			});
			break;
		case "user": {
			const contentParts = [];
			for (const block of message.content) switch (block.type) {
				case "text":
					contentParts.push({
						type: "input_text",
						text: block.text
					});
					break;
				case "file":
					switch (block.data.type) {
						case "reference":
							contentParts.push({
								type: "input_file",
								file_id: resolveProviderReference({
									reference: block.data.reference,
									provider: "xai"
								})
							});
							break;
						case "text": throw new UnsupportedFunctionalityError({ functionality: "text file parts" });
						case "url":
						case "data": if (getTopLevelMediaType(block.mediaType) === "image") {
							const imageUrl = block.data.type === "url" ? block.data.url.toString() : `data:${resolveFullMediaType({ part: block })};base64,${convertToBase64(block.data.data)}`;
							const filePartOptions = await parseProviderOptions({
								provider: "xai",
								providerOptions: block.providerOptions,
								schema: xaiFilePartProviderOptions
							});
							contentParts.push({
								type: "input_image",
								image_url: imageUrl,
								...filePartOptions?.imageDetail != null && { detail: filePartOptions.imageDetail }
							});
						} else if (block.data.type === "url") contentParts.push({
							type: "input_file",
							file_url: block.data.url.toString()
						});
						else throw new UnsupportedFunctionalityError({ functionality: `file part media type ${block.mediaType} as inline data (xAI Responses requires a URL or a Files API reference for non-image files)` });
					}
					break;
				default: inputWarnings.push({
					type: "other",
					message: "xAI Responses API does not support this content type in user messages"
				});
			}
			input.push({
				role: "user",
				content: contentParts
			});
			break;
		}
		case "assistant":
			for (const part of message.content) switch (part.type) {
				case "text": {
					const id = typeof part.providerOptions?.xai?.itemId === "string" ? part.providerOptions.xai.itemId : void 0;
					input.push({
						role: "assistant",
						content: part.text,
						id
					});
					break;
				}
				case "tool-call": {
					if (part.providerExecuted) break;
					const id = typeof part.providerOptions?.xai?.itemId === "string" ? part.providerOptions.xai.itemId : void 0;
					input.push({
						type: "function_call",
						id: id ?? part.toolCallId,
						call_id: part.toolCallId,
						name: part.toolName,
						arguments: JSON.stringify(part.input),
						status: "completed"
					});
					break;
				}
				case "tool-result": break;
				case "reasoning": {
					const itemId = typeof part.providerOptions?.xai?.itemId === "string" ? part.providerOptions.xai.itemId : void 0;
					const encryptedContent = typeof part.providerOptions?.xai?.reasoningEncryptedContent === "string" ? part.providerOptions.xai.reasoningEncryptedContent : void 0;
					if (itemId != null || encryptedContent != null) {
						const summaryParts = [];
						if (part.text.length > 0) summaryParts.push({
							type: "summary_text",
							text: part.text
						});
						input.push({
							type: "reasoning",
							id: itemId ?? "",
							summary: summaryParts,
							status: "completed",
							...encryptedContent != null && { encrypted_content: encryptedContent }
						});
					} else inputWarnings.push({
						type: "other",
						message: "Reasoning parts without itemId or encrypted content cannot be sent back to xAI. Skipping."
					});
					break;
				}
				case "reasoning-file":
				case "custom":
				case "file":
					inputWarnings.push({
						type: "other",
						message: `xAI Responses API does not support ${part.type} in assistant messages`
					});
					break;
				default: inputWarnings.push({
					type: "other",
					message: "xAI Responses API does not support this content type in assistant messages"
				});
			}
			break;
		case "tool":
			for (const part of message.content) {
				if (part.type === "tool-approval-response") continue;
				const output = part.output;
				let outputValue;
				switch (output.type) {
					case "text":
					case "error-text":
						outputValue = output.value;
						break;
					case "execution-denied":
						outputValue = output.reason ?? "tool execution denied";
						break;
					case "json":
					case "error-json":
						outputValue = JSON.stringify(output.value);
						break;
					case "content":
						outputValue = [];
						for (const item of output.value) switch (item.type) {
							case "text":
								outputValue.push({
									type: "input_text",
									text: item.text
								});
								break;
							case "file": if (getTopLevelMediaType(item.mediaType) === "image" && (item.data.type === "data" || item.data.type === "url")) outputValue.push({
								type: "input_image",
								image_url: item.data.type === "url" ? item.data.url.toString() : `data:${resolveFullMediaType({ part: item })};base64,${convertToBase64(item.data.data)}`
							});
						}
						break;
					default: outputValue = "";
				}
				input.push({
					type: "function_call_output",
					call_id: part.toolCallId,
					output: outputValue
				});
			}
			break;
		default: inputWarnings.push({
			type: "other",
			message: "unsupported message role"
		});
	}
	return {
		input,
		inputWarnings
	};
}
function convertXaiResponsesUsage(usage) {
	const cacheReadTokens = usage.input_tokens_details?.cached_tokens ?? 0;
	const reasoningTokens = usage.output_tokens_details?.reasoning_tokens ?? 0;
	const inputTokensIncludesCached = cacheReadTokens <= usage.input_tokens;
	return {
		inputTokens: {
			total: inputTokensIncludesCached ? usage.input_tokens : usage.input_tokens + cacheReadTokens,
			noCache: inputTokensIncludesCached ? usage.input_tokens - cacheReadTokens : usage.input_tokens,
			cacheRead: cacheReadTokens,
			cacheWrite: void 0
		},
		outputTokens: {
			total: usage.output_tokens,
			text: usage.output_tokens - reasoningTokens,
			reasoning: reasoningTokens
		},
		raw: usage
	};
}
function mapXaiResponsesFinishReason(finishReason) {
	switch (finishReason) {
		case "stop":
		case "completed": return "stop";
		case "length":
		case "max_output_tokens": return "length";
		case "tool_calls":
		case "function_call": return "tool-calls";
		case "content_filter": return "content-filter";
		default: return "other";
	}
}
var annotationSchema = () => union([object({
	type: literal("url_citation"),
	url: string(),
	title: string().optional()
}), object({ type: string() })]);
var messageContentPartSchema = () => object({
	type: string(),
	text: string().optional(),
	logprobs: array(any()).optional(),
	annotations: array(annotationSchema()).optional()
});
var reasoningSummaryPartSchema = () => object({
	type: string(),
	text: string()
});
var toolCallSchema = () => object({
	name: string().optional(),
	arguments: string().optional(),
	input: string().optional(),
	call_id: string().optional(),
	id: string(),
	status: string(),
	action: any().optional()
});
var webSearchWireSourceSchema = object({
	type: literal("url"),
	url: string()
});
var webSearchWireActionSchema = discriminatedUnion("type", [
	object({
		type: literal("search"),
		query: string().nullish(),
		queries: array(string()).nullish(),
		sources: array(unknown()).nullish()
	}),
	object({
		type: literal("open_page"),
		url: string().nullish(),
		sources: array(unknown()).nullish()
	}),
	object({
		type: literal("find_in_page"),
		url: string().nullish(),
		pattern: string().nullish(),
		sources: array(unknown()).nullish()
	})
]);
var mcpCallSchema = () => object({
	name: string().optional(),
	arguments: string().optional(),
	output: string().optional(),
	error: string().optional(),
	id: string(),
	status: string(),
	server_label: string().optional()
});
var outputItemSchema = () => discriminatedUnion("type", [
	object({
		type: literal("web_search_call"),
		...toolCallSchema().shape
	}),
	object({
		type: literal("x_search_call"),
		...toolCallSchema().shape
	}),
	object({
		type: literal("code_interpreter_call"),
		...toolCallSchema().shape
	}),
	object({
		type: literal("code_execution_call"),
		...toolCallSchema().shape
	}),
	object({
		type: literal("view_image_call"),
		...toolCallSchema().shape
	}),
	object({
		type: literal("view_x_video_call"),
		...toolCallSchema().shape
	}),
	object({
		type: literal("file_search_call"),
		id: string(),
		status: string(),
		queries: array(string()).optional(),
		results: array(object({
			file_id: string(),
			filename: string(),
			score: number(),
			text: string()
		})).nullish()
	}),
	object({
		type: literal("image_generation_call"),
		id: string(),
		status: string(),
		prompt: string().nullish(),
		result: string().nullish()
	}),
	object({
		type: literal("custom_tool_call"),
		...toolCallSchema().shape
	}),
	object({
		type: literal("mcp_call"),
		...mcpCallSchema().shape
	}),
	object({
		type: literal("message"),
		role: string(),
		content: array(messageContentPartSchema()),
		id: string(),
		status: string()
	}),
	object({
		type: literal("function_call"),
		name: string(),
		arguments: string(),
		call_id: string(),
		id: string()
	}),
	object({
		type: literal("reasoning"),
		id: string(),
		summary: array(reasoningSummaryPartSchema()),
		content: array(object({
			type: string(),
			text: string()
		})).nullish(),
		status: string(),
		encrypted_content: string().nullish()
	})
]);
var xaiResponsesUsageSchema = () => object({
	input_tokens: number(),
	output_tokens: number(),
	total_tokens: number().optional(),
	input_tokens_details: object({ cached_tokens: number().optional() }).catchall(json()).optional(),
	output_tokens_details: object({ reasoning_tokens: number().optional() }).catchall(json()).optional(),
	num_sources_used: number().optional(),
	num_server_side_tools_used: number().optional(),
	cost_in_usd_ticks: number().nullish()
}).catchall(json());
var xaiResponsesResponseSchema = () => object({
	id: string().nullish(),
	created_at: number().nullish(),
	model: string().nullish(),
	object: literal("response"),
	output: array(outputItemSchema()),
	usage: xaiResponsesUsageSchema().nullish(),
	status: string(),
	service_tier: string().nullish(),
	prompt_cache_key: string().nullish(),
	safety_identifier: string().nullish()
});
var xaiResponsesResponseSchemaValidator = lazySchema(() => zodSchema(xaiResponsesResponseSchema()));
var xaiResponsesChunkSchema = lazySchema(() => zodSchema(union([
	object({
		type: literal("response.created"),
		response: xaiResponsesResponseSchema().partial({
			usage: true,
			status: true
		})
	}),
	object({
		type: literal("response.in_progress"),
		response: xaiResponsesResponseSchema().partial({
			usage: true,
			status: true
		})
	}),
	object({
		type: literal("response.output_item.added"),
		item: outputItemSchema(),
		output_index: number()
	}),
	object({
		type: literal("response.output_item.done"),
		item: outputItemSchema(),
		output_index: number()
	}),
	object({
		type: literal("response.content_part.added"),
		item_id: string(),
		output_index: number(),
		content_index: number(),
		part: messageContentPartSchema()
	}),
	object({
		type: literal("response.content_part.done"),
		item_id: string(),
		output_index: number(),
		content_index: number(),
		part: messageContentPartSchema()
	}),
	object({
		type: literal("response.output_text.delta"),
		item_id: string(),
		output_index: number(),
		content_index: number(),
		delta: string(),
		logprobs: array(any()).optional()
	}),
	object({
		type: literal("response.output_text.done"),
		item_id: string(),
		output_index: number(),
		content_index: number(),
		text: string(),
		logprobs: array(any()).optional(),
		annotations: array(annotationSchema()).optional()
	}),
	object({
		type: literal("response.output_text.annotation.added"),
		item_id: string(),
		output_index: number(),
		content_index: number(),
		annotation_index: number(),
		annotation: annotationSchema()
	}),
	object({
		type: literal("response.reasoning_summary_part.added"),
		item_id: string(),
		output_index: number(),
		summary_index: number(),
		part: reasoningSummaryPartSchema()
	}),
	object({
		type: literal("response.reasoning_summary_part.done"),
		item_id: string(),
		output_index: number(),
		summary_index: number(),
		part: reasoningSummaryPartSchema()
	}),
	object({
		type: literal("response.reasoning_summary_text.delta"),
		item_id: string(),
		output_index: number(),
		summary_index: number(),
		delta: string()
	}),
	object({
		type: literal("response.reasoning_summary_text.done"),
		item_id: string(),
		output_index: number(),
		summary_index: number(),
		text: string()
	}),
	object({
		type: literal("response.reasoning_text.delta"),
		item_id: string(),
		output_index: number(),
		content_index: number(),
		delta: string()
	}),
	object({
		type: literal("response.reasoning_text.done"),
		item_id: string(),
		output_index: number(),
		content_index: number(),
		text: string()
	}),
	object({
		type: literal("response.web_search_call.in_progress"),
		item_id: string(),
		output_index: number()
	}),
	object({
		type: literal("response.web_search_call.searching"),
		item_id: string(),
		output_index: number()
	}),
	object({
		type: literal("response.web_search_call.completed"),
		item_id: string(),
		output_index: number()
	}),
	object({
		type: literal("response.x_search_call.in_progress"),
		item_id: string(),
		output_index: number()
	}),
	object({
		type: literal("response.x_search_call.searching"),
		item_id: string(),
		output_index: number()
	}),
	object({
		type: literal("response.x_search_call.completed"),
		item_id: string(),
		output_index: number()
	}),
	object({
		type: literal("response.file_search_call.in_progress"),
		item_id: string(),
		output_index: number()
	}),
	object({
		type: literal("response.file_search_call.searching"),
		item_id: string(),
		output_index: number()
	}),
	object({
		type: literal("response.file_search_call.completed"),
		item_id: string(),
		output_index: number()
	}),
	object({
		type: literal("response.image_generation_call.in_progress"),
		item_id: string(),
		output_index: number()
	}),
	object({
		type: literal("response.image_generation_call.generating"),
		item_id: string(),
		output_index: number()
	}),
	object({
		type: literal("response.image_generation_call.completed"),
		item_id: string(),
		output_index: number()
	}),
	object({
		type: literal("response.code_execution_call.in_progress"),
		item_id: string(),
		output_index: number()
	}),
	object({
		type: literal("response.code_execution_call.executing"),
		item_id: string(),
		output_index: number()
	}),
	object({
		type: literal("response.code_execution_call.completed"),
		item_id: string(),
		output_index: number()
	}),
	object({
		type: literal("response.code_interpreter_call.in_progress"),
		item_id: string(),
		output_index: number()
	}),
	object({
		type: literal("response.code_interpreter_call.executing"),
		item_id: string(),
		output_index: number()
	}),
	object({
		type: literal("response.code_interpreter_call.interpreting"),
		item_id: string(),
		output_index: number()
	}),
	object({
		type: literal("response.code_interpreter_call.completed"),
		item_id: string(),
		output_index: number()
	}),
	object({
		type: literal("response.code_interpreter_call_code.delta"),
		item_id: string(),
		output_index: number(),
		delta: string()
	}),
	object({
		type: literal("response.code_interpreter_call_code.done"),
		item_id: string(),
		output_index: number(),
		code: string()
	}),
	object({
		type: literal("response.custom_tool_call_input.delta"),
		item_id: string(),
		output_index: number(),
		delta: string()
	}),
	object({
		type: literal("response.custom_tool_call_input.done"),
		item_id: string(),
		output_index: number(),
		input: string()
	}),
	object({
		type: literal("response.function_call_arguments.delta"),
		item_id: string(),
		output_index: number(),
		delta: string()
	}),
	object({
		type: literal("response.function_call_arguments.done"),
		item_id: string(),
		output_index: number(),
		arguments: string()
	}),
	object({
		type: literal("response.mcp_call.in_progress"),
		item_id: string(),
		output_index: number()
	}),
	object({
		type: literal("response.mcp_call.executing"),
		item_id: string(),
		output_index: number()
	}),
	object({
		type: literal("response.mcp_call.completed"),
		item_id: string(),
		output_index: number()
	}),
	object({
		type: literal("response.mcp_call.failed"),
		item_id: string(),
		output_index: number()
	}),
	object({
		type: literal("response.mcp_call_arguments.delta"),
		item_id: string(),
		output_index: number(),
		delta: string()
	}),
	object({
		type: literal("response.mcp_call_arguments.done"),
		item_id: string(),
		output_index: number(),
		arguments: string().optional()
	}),
	object({
		type: literal("response.mcp_call_output.delta"),
		item_id: string(),
		output_index: number(),
		delta: string()
	}),
	object({
		type: literal("response.mcp_call_output.done"),
		item_id: string(),
		output_index: number(),
		output: string().optional()
	}),
	object({
		type: literal("response.incomplete"),
		response: object({
			incomplete_details: object({ reason: string() }).nullish(),
			usage: xaiResponsesUsageSchema().nullish(),
			service_tier: string().nullish(),
			prompt_cache_key: string().nullish(),
			safety_identifier: string().nullish()
		})
	}),
	object({
		type: literal("response.failed"),
		response: object({
			error: object({
				code: string().nullish(),
				message: string()
			}).nullish(),
			incomplete_details: object({ reason: string() }).nullish(),
			usage: xaiResponsesUsageSchema().nullish()
		})
	}),
	object({
		type: literal("error"),
		code: string().nullish(),
		message: string(),
		param: string().nullish()
	}),
	object({
		type: literal("response.done"),
		response: xaiResponsesResponseSchema()
	}),
	object({
		type: literal("response.completed"),
		response: xaiResponsesResponseSchema()
	})
])));
/**
* @see https://docs.x.ai/docs/api-reference#create-new-response
*/
var xaiLanguageModelResponsesOptions = lazySchema(() => zodSchema(object({
	/**
	* Constrains how hard a reasoning model thinks before responding.
	* Possible values are `none` (disables reasoning entirely; supported by
	* `grok-4.3` and newer reasoning models), `low` (uses fewer reasoning
	* tokens), `medium`, `high` (uses more reasoning tokens), and `xhigh`
	* (supported by `grok-4.6`).
	*
	* @see https://docs.x.ai/docs/guides/reasoning
	*/
	reasoningEffort: _enum([
		"none",
		"low",
		"medium",
		"high",
		"xhigh"
	]).optional(),
	/**
	* @deprecated xAI ignores the requested summary level and always returns a
	* detailed reasoning summary.
	*/
	reasoningSummary: _enum([
		"auto",
		"concise",
		"detailed"
	]).optional(),
	logprobs: boolean().optional(),
	topLogprobs: number().int().min(0).max(8).optional(),
	/** Min-p sampling threshold between 0 and 1. */
	minP: number().min(0).max(1).optional(),
	/** Maximum number of agentic tool-calling turns. */
	maxTurns: number().int().optional(),
	/** Whether the model may call tools in parallel. @default true */
	parallelToolCalls: boolean().optional(),
	/** Cache key used to route requests with shared prompt prefixes. */
	promptCacheKey: string().optional(),
	/** Stable identifier used to attribute policy violations to an end user. */
	safetyIdentifier: string().optional(),
	serviceTier: _enum(["default", "priority"]).optional(),
	/**
	* Whether to store the input message(s) and model response for later retrieval.
	* Must be set to `false` for teams with Zero Data Retention (ZDR) enabled,
	* otherwise the API will return an error.
	* @default true
	*/
	store: boolean().optional(),
	/**
	* The ID of the previous response from the model.
	*/
	previousResponseId: string().optional(),
	/** A unique identifier for the end user, used for abuse monitoring. */
	user: string().optional(),
	/**
	* Specify additional output data to include in the model response.
	* Example values: 'file_search_call.results'.
	*/
	include: array(_enum([
		"file_search_call.results",
		"web_search_call.action.sources",
		"code_interpreter_call.outputs",
		"reasoning.encrypted_content",
		"no_inline_citations"
	])).nullish()
})));
/**
* Schema for file search tool arguments.
* @see https://docs.x.ai/docs/guides/using-collections/api
*/
var fileSearchArgsSchema = lazySchema(() => zodSchema(object({
	vectorStoreIds: array(string()),
	maxNumResults: number().optional()
})));
var fileSearchOutputSchema = lazySchema(() => zodSchema(object({
	queries: array(string()),
	results: array(object({
		fileId: string(),
		filename: string(),
		score: number().min(0).max(1),
		text: string()
	})).nullable()
})));
var fileSearchToolFactory = createProviderExecutedToolFactory({
	id: "xai.file_search",
	inputSchema: lazySchema(() => zodSchema(object({}))),
	outputSchema: fileSearchOutputSchema
});
var fileSearch = (args) => fileSearchToolFactory(args);
/**
* Schema for image generation tool arguments.
* @see https://docs.x.ai/developers/tools/overview
*/
var imageGenerationArgsSchema = lazySchema(() => zodSchema(object({ action: _enum([
	"auto",
	"generate",
	"edit"
]).optional() })));
var imageGenerationInputSchema = lazySchema(() => zodSchema(object({})));
var imageGenerationOutputSchema = lazySchema(() => zodSchema(object({
	result: string(),
	prompt: string().optional()
})));
var imageGenerationToolFactory = createProviderExecutedToolFactory({
	id: "xai.image_generation",
	inputSchema: imageGenerationInputSchema,
	outputSchema: imageGenerationOutputSchema
});
var imageGeneration = (args = {}) => imageGenerationToolFactory(args);
var mcpServerArgsSchema = lazySchema(() => zodSchema(object({
	serverUrl: string().describe("The URL of the MCP server"),
	serverLabel: string().optional().describe("A label for the MCP server"),
	serverDescription: string().optional().describe("Description of the MCP server"),
	allowedTools: array(string()).optional().describe("List of allowed tool names"),
	headers: record(string(), string()).optional().describe("Custom headers to send"),
	authorization: string().optional().describe("Authorization header value")
})));
var mcpServerOutputSchema = lazySchema(() => zodSchema(object({
	name: string(),
	arguments: string(),
	result: unknown()
})));
var mcpServerToolFactory = createProviderExecutedToolFactory({
	id: "xai.mcp",
	inputSchema: lazySchema(() => zodSchema(object({}))),
	outputSchema: mcpServerOutputSchema
});
var mcpServer = (args) => mcpServerToolFactory(args);
var webSearchArgsSchema = lazySchema(() => zodSchema(object({
	allowedDomains: array(string()).max(5).optional(),
	excludedDomains: array(string()).max(5).optional(),
	enableImageSearch: boolean().optional(),
	enableImageUnderstanding: boolean().optional()
})));
var webSearchOutputSchema = lazySchema(() => zodSchema(object({
	action: discriminatedUnion("type", [
		object({
			type: literal("search"),
			query: string().optional(),
			queries: array(string()).optional()
		}),
		object({
			type: literal("openPage"),
			url: string().nullish()
		}),
		object({
			type: literal("findInPage"),
			url: string().nullish(),
			pattern: string().nullish()
		})
	]).optional(),
	sources: array(object({
		type: literal("url"),
		url: string()
	})).optional()
})));
var webSearchToolFactory = createProviderExecutedToolFactory({
	id: "xai.web_search",
	inputSchema: lazySchema(() => zodSchema(object({}))),
	outputSchema: webSearchOutputSchema
});
var webSearch = (args = {}) => webSearchToolFactory(args);
var xSearchArgsSchema = lazySchema(() => zodSchema(object({
	allowedXHandles: array(string()).max(20).optional(),
	excludedXHandles: array(string()).max(20).optional(),
	fromDate: string().optional(),
	toDate: string().optional(),
	enableImageUnderstanding: boolean().optional(),
	enableVideoUnderstanding: boolean().optional()
})));
var xSearchOutputSchema = lazySchema(() => zodSchema(object({
	query: string(),
	posts: array(object({
		author: string(),
		text: string(),
		url: string(),
		likes: number()
	}))
})));
var xSearchToolFactory = createProviderExecutedToolFactory({
	id: "xai.x_search",
	inputSchema: lazySchema(() => zodSchema(object({}))),
	outputSchema: xSearchOutputSchema
});
var xSearch = (args = {}) => xSearchToolFactory(args);
async function prepareResponsesTools({ tools, toolChoice }) {
	const normalizedTools = tools?.length ? tools : void 0;
	const toolWarnings = [];
	if (normalizedTools == null) return {
		tools: void 0,
		toolChoice: void 0,
		toolWarnings
	};
	const xaiTools = [];
	const toolByName = /* @__PURE__ */ new Map();
	for (const tool of normalizedTools) {
		toolByName.set(tool.name, tool);
		if (tool.type === "provider") switch (tool.id) {
			case "xai.web_search": {
				const args = await validateTypes({
					value: tool.args,
					schema: webSearchArgsSchema
				});
				xaiTools.push({
					type: "web_search",
					allowed_domains: args.allowedDomains,
					excluded_domains: args.excludedDomains,
					enable_image_search: args.enableImageSearch,
					enable_image_understanding: args.enableImageUnderstanding
				});
				break;
			}
			case "xai.x_search": {
				const args = await validateTypes({
					value: tool.args,
					schema: xSearchArgsSchema
				});
				xaiTools.push({
					type: "x_search",
					allowed_x_handles: args.allowedXHandles,
					excluded_x_handles: args.excludedXHandles,
					from_date: args.fromDate,
					to_date: args.toDate,
					enable_image_understanding: args.enableImageUnderstanding,
					enable_video_understanding: args.enableVideoUnderstanding
				});
				break;
			}
			case "xai.code_execution":
				xaiTools.push({ type: "code_interpreter" });
				break;
			case "xai.view_image":
				xaiTools.push({ type: "view_image" });
				break;
			case "xai.view_x_video":
				xaiTools.push({ type: "view_x_video" });
				break;
			case "xai.image_generation": {
				const args = await validateTypes({
					value: tool.args,
					schema: imageGenerationArgsSchema
				});
				xaiTools.push({
					type: "image_generation",
					action: args.action
				});
				break;
			}
			case "xai.file_search": {
				const args = await validateTypes({
					value: tool.args,
					schema: fileSearchArgsSchema
				});
				xaiTools.push({
					type: "file_search",
					vector_store_ids: args.vectorStoreIds,
					max_num_results: args.maxNumResults
				});
				break;
			}
			case "xai.mcp": {
				const args = await validateTypes({
					value: tool.args,
					schema: mcpServerArgsSchema
				});
				xaiTools.push({
					type: "mcp",
					server_url: args.serverUrl,
					server_label: args.serverLabel,
					server_description: args.serverDescription,
					allowed_tools: args.allowedTools,
					headers: args.headers,
					authorization: args.authorization
				});
				break;
			}
			default: toolWarnings.push({
				type: "unsupported",
				feature: `provider-defined tool ${tool.name}`
			});
		}
		else xaiTools.push({
			type: "function",
			name: tool.name,
			description: tool.description,
			parameters: tool.inputSchema,
			...tool.strict != null ? { strict: tool.strict } : {}
		});
	}
	if (toolChoice == null) return {
		tools: xaiTools,
		toolChoice: void 0,
		toolWarnings
	};
	const type = toolChoice.type;
	switch (type) {
		case "auto":
		case "none": return {
			tools: xaiTools,
			toolChoice: type,
			toolWarnings
		};
		case "required": return {
			tools: xaiTools,
			toolChoice: "required",
			toolWarnings
		};
		case "tool": {
			const selectedTool = toolByName.get(toolChoice.toolName);
			if (selectedTool == null) return {
				tools: xaiTools,
				toolChoice: void 0,
				toolWarnings
			};
			if (selectedTool.type === "provider") {
				toolWarnings.push({
					type: "unsupported",
					feature: `toolChoice for server-side tool "${selectedTool.name}"`
				});
				return {
					tools: xaiTools,
					toolChoice: void 0,
					toolWarnings
				};
			}
			return {
				tools: xaiTools,
				toolChoice: {
					type: "function",
					name: selectedTool.name
				},
				toolWarnings
			};
		}
		default: throw new UnsupportedFunctionalityError({ functionality: `tool choice type: ${type}` });
	}
}
function createXaiResponsesStreamError({ message, code, eventType, data }) {
	const statusCode = getHttpStatusCode(code);
	return createProviderStreamError({
		message,
		type: eventType,
		code: code ?? void 0,
		...statusCode != null ? {
			statusCode,
			isRetryable: isRetryableStatusCode(statusCode)
		} : getXaiResponsesStreamErrorMetadata(code),
		data
	});
}
function getXaiResponsesStreamErrorMetadata(code) {
	switch (code) {
		case "rate_limit_exceeded":
		case "rate_limit_error": return {
			statusCode: 429,
			isRetryable: true
		};
		case "insufficient_quota": return {
			statusCode: 429,
			isRetryable: false
		};
		case "api_error":
		case "internal_server_error":
		case "server_error": return {
			statusCode: 500,
			isRetryable: true
		};
		case "overloaded_error":
		case "service_unavailable": return {
			statusCode: 503,
			isRetryable: true
		};
		case "timeout":
		case "timeout_error": return {
			statusCode: 504,
			isRetryable: true
		};
		case "authentication_error":
		case "invalid_api_key": return {
			statusCode: 401,
			isRetryable: false
		};
		case "permission_error": return {
			statusCode: 403,
			isRetryable: false
		};
		case "not_found_error":
		case "model_not_found": return {
			statusCode: 404,
			isRetryable: false
		};
		case "bad_request":
		case "context_length_exceeded":
		case "invalid_request_error": return {
			statusCode: 400,
			isRetryable: false
		};
		default: return {};
	}
}
function getHttpStatusCode(value) {
	const statusCode = typeof value === "string" && /^\d{3}$/.test(value) ? Number(value) : value;
	return typeof statusCode === "number" && Number.isInteger(statusCode) && statusCode >= 400 && statusCode <= 599 ? statusCode : void 0;
}
function isRetryableStatusCode(statusCode) {
	return statusCode === 408 || statusCode === 409 || statusCode === 429 || statusCode >= 500;
}
var xaiResponsesSupportedUrls = {
	"image/*": [/^https?:\/\/.*$/],
	"application/pdf": [/^https?:\/\/.*$/],
	"text/*": [/^https?:\/\/.*$/]
};
var XaiResponsesLanguageModel = class XaiResponsesLanguageModel {
	static [WORKFLOW_SERIALIZE](model) {
		return serializeModelOptions({
			modelId: model.modelId,
			config: model.config
		});
	}
	static [WORKFLOW_DESERIALIZE](options) {
		return new XaiResponsesLanguageModel(options.modelId, options.config);
	}
	constructor(modelId, config) {
		this.specificationVersion = "v4";
		this.supportedUrls = xaiResponsesSupportedUrls;
		this.modelId = modelId;
		this.config = config;
	}
	get provider() {
		return this.config.provider;
	}
	static async prepareRequest({ modelId, options: { prompt, maxOutputTokens, temperature, topP, topK, frequencyPenalty, presencePenalty, stopSequences, seed, responseFormat, providerOptions, tools, toolChoice, reasoning } }) {
		const warnings = [];
		const options = await parseProviderOptions({
			provider: "xai",
			providerOptions,
			schema: xaiLanguageModelResponsesOptions
		}) ?? {};
		if (frequencyPenalty != null) warnings.push({
			type: "unsupported",
			feature: "frequencyPenalty"
		});
		if (presencePenalty != null) warnings.push({
			type: "unsupported",
			feature: "presencePenalty"
		});
		if (stopSequences != null) warnings.push({
			type: "unsupported",
			feature: "stopSequences"
		});
		const webSearchToolName = tools?.find((tool) => tool.type === "provider" && tool.id === "xai.web_search")?.name;
		const xSearchToolName = tools?.find((tool) => tool.type === "provider" && tool.id === "xai.x_search")?.name;
		const codeExecutionToolName = tools?.find((tool) => tool.type === "provider" && tool.id === "xai.code_execution")?.name;
		const mcpToolName = tools?.find((tool) => tool.type === "provider" && tool.id === "xai.mcp")?.name;
		const fileSearchToolName = tools?.find((tool) => tool.type === "provider" && tool.id === "xai.file_search")?.name;
		const imageGenerationToolName = tools?.find((tool) => tool.type === "provider" && tool.id === "xai.image_generation")?.name;
		const { input, inputWarnings } = await convertToXaiResponsesInput({
			prompt,
			store: options.store ?? true
		});
		warnings.push(...inputWarnings);
		const { tools: xaiTools, toolChoice: xaiToolChoice, toolWarnings } = await prepareResponsesTools({
			tools,
			toolChoice
		});
		warnings.push(...toolWarnings);
		let include = options.include ? [...options.include] : void 0;
		if (options.store === false) {
			if (include == null) include = ["reasoning.encrypted_content"];
			else include = [...include, "reasoning.encrypted_content"];
		}
		let resolvedReasoningEffort = options.reasoningEffort;
		if (resolvedReasoningEffort == null && isCustomReasoning(reasoning)) {
			if (!supportsReasoningEffort(modelId)) warnings.push({
				type: "unsupported",
				feature: "reasoning",
				details: `reasoning "${reasoning}" is not supported by this model.`
			});
			else if (reasoning === "none") resolvedReasoningEffort = "none";
			else resolvedReasoningEffort = mapReasoningToProviderEffort({
				reasoning,
				effortMap: {
					minimal: "low",
					low: "low",
					medium: "medium",
					high: "high",
					xhigh: modelId === "grok-4.6" ? "xhigh" : "high",
					max: modelId === "grok-4.6" ? "xhigh" : "high"
				},
				warnings
			});
		}
		const baseArgs = {
			model: modelId,
			input,
			logprobs: options.logprobs === true || options.topLogprobs != null ? true : void 0,
			top_logprobs: options.topLogprobs,
			max_output_tokens: maxOutputTokens,
			temperature,
			top_p: topP,
			top_k: topK,
			min_p: options.minP,
			seed,
			...responseFormat?.type === "json" && { text: { format: responseFormat.schema != null ? {
				type: "json_schema",
				strict: true,
				name: responseFormat.name ?? "response",
				description: responseFormat.description,
				schema: responseFormat.schema
			} : { type: "json_object" } } },
			...resolvedReasoningEffort != null && { reasoning: { effort: resolvedReasoningEffort } },
			...options.store === false && { store: options.store },
			...include != null && { include },
			...options.previousResponseId != null && { previous_response_id: options.previousResponseId },
			...options.maxTurns != null && { max_turns: options.maxTurns },
			...options.parallelToolCalls != null && { parallel_tool_calls: options.parallelToolCalls },
			...options.promptCacheKey != null && { prompt_cache_key: options.promptCacheKey },
			...options.safetyIdentifier != null && { safety_identifier: options.safetyIdentifier },
			...options.serviceTier != null && { service_tier: options.serviceTier },
			...options.user != null && { user: options.user }
		};
		if (xaiTools && xaiTools.length > 0) baseArgs.tools = xaiTools;
		if (xaiToolChoice != null) baseArgs.tool_choice = xaiToolChoice;
		return {
			args: baseArgs,
			warnings,
			webSearchToolName,
			xSearchToolName,
			codeExecutionToolName,
			mcpToolName,
			fileSearchToolName,
			imageGenerationToolName
		};
	}
	getArgs(options) {
		return XaiResponsesLanguageModel.prepareRequest({
			modelId: this.modelId,
			options
		});
	}
	async doGenerate(options) {
		const { args: body, warnings, webSearchToolName, xSearchToolName, codeExecutionToolName, mcpToolName, fileSearchToolName, imageGenerationToolName } = await this.getArgs(options);
		const { responseHeaders, value: response, rawValue: rawResponse } = await postJsonToApi({
			url: `${this.config.baseURL ?? "https://api.x.ai/v1"}/responses`,
			headers: combineHeaders(this.config.headers?.(), options.headers),
			body,
			failedResponseHandler: xaiFailedResponseHandler,
			successfulResponseHandler: createJsonResponseHandler(xaiResponsesResponseSchemaValidator),
			abortSignal: options.abortSignal,
			fetch: this.config.fetch
		});
		const content = [];
		let hasFunctionCall = false;
		const webSearchSubTools = [
			"web_search",
			"web_search_with_snippets",
			"browse_page"
		];
		const xSearchSubTools = [
			"x_user_search",
			"x_keyword_search",
			"x_semantic_search",
			"x_thread_fetch"
		];
		for (const part of response.output) {
			if (part.type === "file_search_call") {
				const toolName = fileSearchToolName ?? "file_search";
				content.push({
					type: "tool-call",
					toolCallId: part.id,
					toolName,
					input: "",
					providerExecuted: true
				});
				content.push({
					type: "tool-result",
					toolCallId: part.id,
					toolName,
					result: {
						queries: part.queries ?? [],
						results: part.results?.map((result) => ({
							fileId: result.file_id,
							filename: result.filename,
							score: result.score,
							text: result.text
						})) ?? null
					}
				});
				continue;
			}
			if (part.type === "image_generation_call") {
				const toolName = imageGenerationToolName ?? "image_generation";
				content.push({
					type: "tool-call",
					toolCallId: part.id,
					toolName,
					input: "{}",
					providerExecuted: true
				});
				if (part.result != null) content.push({
					type: "tool-result",
					toolCallId: part.id,
					toolName,
					result: {
						result: part.result,
						...part.prompt != null && { prompt: part.prompt }
					}
				});
				else content.push({
					type: "tool-result",
					toolCallId: part.id,
					toolName,
					isError: true,
					result: `Image generation failed (status: ${part.status}).`
				});
				continue;
			}
			if (part.type === "web_search_call" || part.type === "x_search_call" || part.type === "code_interpreter_call" || part.type === "code_execution_call" || part.type === "view_image_call" || part.type === "view_x_video_call" || part.type === "custom_tool_call" || part.type === "mcp_call") {
				let toolName = part.name ?? "";
				if (webSearchSubTools.includes(part.name ?? "") || part.type === "web_search_call") toolName = webSearchToolName ?? "web_search";
				else if (xSearchSubTools.includes(part.name ?? "") || part.type === "x_search_call") toolName = xSearchToolName ?? "x_search";
				else if (part.name === "code_execution" || part.type === "code_interpreter_call" || part.type === "code_execution_call") toolName = codeExecutionToolName ?? "code_execution";
				else if (part.type === "mcp_call") toolName = mcpToolName ?? part.name ?? "mcp";
				const toolInput = part.type === "custom_tool_call" ? part.input ?? "" : part.type === "mcp_call" ? part.arguments ?? "" : part.arguments ?? "";
				content.push({
					type: "tool-call",
					toolCallId: part.id,
					toolName,
					input: toolInput,
					providerExecuted: true
				});
				if (part.type === "web_search_call") content.push({
					type: "tool-result",
					toolCallId: part.id,
					toolName,
					result: mapWebSearchAction(part.action)
				});
				continue;
			}
			switch (part.type) {
				case "message":
					for (const contentPart of part.content) {
						if (contentPart.text) content.push({
							type: "text",
							text: contentPart.text
						});
						if (contentPart.annotations) {
							for (const annotation of contentPart.annotations) if (annotation.type === "url_citation" && "url" in annotation) content.push({
								type: "source",
								sourceType: "url",
								id: this.config.generateId(),
								url: annotation.url,
								title: annotation.title ?? annotation.url
							});
						}
					}
					break;
				case "function_call":
					hasFunctionCall = true;
					content.push({
						type: "tool-call",
						toolCallId: part.call_id,
						toolName: part.name,
						input: part.arguments
					});
					break;
				case "reasoning": {
					const reasoningText = (part.summary.length > 0 ? part.summary.map((s) => s.text) : (part.content ?? []).map((c) => c.text)).filter((text) => text && text.length > 0).join("");
					if (reasoningText || part.encrypted_content) {
						const hasMetadata = part.encrypted_content || part.id;
						content.push({
							type: "reasoning",
							text: reasoningText,
							...hasMetadata && { providerMetadata: { xai: {
								...part.encrypted_content && { reasoningEncryptedContent: part.encrypted_content },
								...part.id && { itemId: part.id }
							} } }
						});
					}
					break;
				}
			}
		}
		return {
			content,
			finishReason: {
				unified: hasFunctionCall ? "tool-calls" : mapXaiResponsesFinishReason(response.status),
				raw: response.status ?? void 0
			},
			usage: response.usage ? convertXaiResponsesUsage(response.usage) : {
				inputTokens: {
					total: 0,
					noCache: 0,
					cacheRead: 0,
					cacheWrite: 0
				},
				outputTokens: {
					total: 0,
					text: 0,
					reasoning: 0
				}
			},
			...(response.usage?.cost_in_usd_ticks != null || response.service_tier != null || response.prompt_cache_key != null || response.safety_identifier != null) && { providerMetadata: { xai: {
				...response.usage?.cost_in_usd_ticks != null && { costInUsdTicks: response.usage.cost_in_usd_ticks },
				...response.service_tier != null && { serviceTier: response.service_tier },
				...response.prompt_cache_key != null && { promptCacheKey: response.prompt_cache_key },
				...response.safety_identifier != null && { safetyIdentifier: response.safety_identifier }
			} } },
			request: { body },
			response: {
				...getResponseMetadata(response),
				headers: responseHeaders,
				body: rawResponse
			},
			warnings
		};
	}
	async doStream(options) {
		const { args, warnings, webSearchToolName, xSearchToolName, codeExecutionToolName, mcpToolName, fileSearchToolName, imageGenerationToolName } = await this.getArgs(options);
		const body = {
			...args,
			stream: true
		};
		const { responseHeaders, value: response } = await postJsonToApi({
			url: `${this.config.baseURL ?? "https://api.x.ai/v1"}/responses`,
			headers: combineHeaders(this.config.headers?.(), options.headers),
			body,
			failedResponseHandler: xaiFailedResponseHandler,
			successfulResponseHandler: createEventSourceResponseHandler(xaiResponsesChunkSchema),
			abortSignal: options.abortSignal,
			fetch: this.config.fetch
		});
		let finishReason = {
			unified: "other",
			raw: void 0
		};
		let hasFunctionCall = false;
		let usage = void 0;
		let costInUsdTicks = void 0;
		let serviceTier = void 0;
		let promptCacheKey = void 0;
		let safetyIdentifier = void 0;
		let isFirstChunk = true;
		const contentBlocks = {};
		const seenToolCalls = /* @__PURE__ */ new Set();
		const ongoingToolCalls = {};
		const activeReasoning = {};
		const self = this;
		return {
			stream: response.pipeThrough(new TransformStream({
				start(controller) {
					controller.enqueue({
						type: "stream-start",
						warnings
					});
				},
				transform(chunk, controller) {
					if (options.includeRawChunks) controller.enqueue({
						type: "raw",
						rawValue: chunk.rawValue
					});
					if (!chunk.success) {
						controller.enqueue({
							type: "error",
							error: chunk.error
						});
						return;
					}
					const event = chunk.value;
					if (event.type === "response.created" || event.type === "response.in_progress") {
						if (isFirstChunk) {
							controller.enqueue({
								type: "response-metadata",
								...getResponseMetadata(event.response)
							});
							isFirstChunk = false;
						}
						return;
					}
					if (event.type === "response.reasoning_summary_part.added") {
						const blockId = `reasoning-${event.item_id}`;
						if (activeReasoning[event.item_id] == null) {
							activeReasoning[event.item_id] = {};
							controller.enqueue({
								type: "reasoning-start",
								id: blockId,
								providerMetadata: { xai: { itemId: event.item_id } }
							});
						}
					}
					if (event.type === "response.reasoning_summary_text.delta") {
						const blockId = `reasoning-${event.item_id}`;
						controller.enqueue({
							type: "reasoning-delta",
							id: blockId,
							delta: event.delta,
							providerMetadata: { xai: { itemId: event.item_id } }
						});
						return;
					}
					if (event.type === "response.reasoning_summary_text.done") return;
					if (event.type === "response.reasoning_text.delta") {
						const blockId = `reasoning-${event.item_id}`;
						if (activeReasoning[event.item_id] == null) {
							activeReasoning[event.item_id] = {};
							controller.enqueue({
								type: "reasoning-start",
								id: blockId,
								providerMetadata: { xai: { itemId: event.item_id } }
							});
						}
						controller.enqueue({
							type: "reasoning-delta",
							id: blockId,
							delta: event.delta,
							providerMetadata: { xai: { itemId: event.item_id } }
						});
						return;
					}
					if (event.type === "response.reasoning_text.done") return;
					if (event.type === "response.output_text.delta") {
						const blockId = `text-${event.item_id}`;
						if (contentBlocks[blockId] == null) {
							contentBlocks[blockId] = { type: "text" };
							controller.enqueue({
								type: "text-start",
								id: blockId
							});
						}
						controller.enqueue({
							type: "text-delta",
							id: blockId,
							delta: event.delta
						});
						return;
					}
					if (event.type === "response.output_text.done") {
						if (event.annotations) {
							for (const annotation of event.annotations) if (annotation.type === "url_citation" && "url" in annotation) controller.enqueue({
								type: "source",
								sourceType: "url",
								id: self.config.generateId(),
								url: annotation.url,
								title: annotation.title ?? annotation.url
							});
						}
						return;
					}
					if (event.type === "response.output_text.annotation.added") {
						const annotation = event.annotation;
						if (annotation.type === "url_citation" && "url" in annotation) controller.enqueue({
							type: "source",
							sourceType: "url",
							id: self.config.generateId(),
							url: annotation.url,
							title: annotation.title ?? annotation.url
						});
						return;
					}
					if (event.type === "response.done" || event.type === "response.completed" || event.type === "response.incomplete") {
						const response = event.response;
						if (response.usage) {
							usage = convertXaiResponsesUsage(response.usage);
							costInUsdTicks = response.usage.cost_in_usd_ticks ?? void 0;
						}
						serviceTier = response.service_tier ?? void 0;
						promptCacheKey = response.prompt_cache_key ?? void 0;
						safetyIdentifier = response.safety_identifier ?? void 0;
						if (event.type === "response.incomplete") {
							const reason = "incomplete_details" in response ? response.incomplete_details?.reason : void 0;
							finishReason = {
								unified: reason ? mapXaiResponsesFinishReason(reason) : "other",
								raw: reason ?? "incomplete"
							};
						} else if ("status" in response && response.status) finishReason = {
							unified: hasFunctionCall ? "tool-calls" : mapXaiResponsesFinishReason(response.status),
							raw: response.status
						};
						return;
					}
					if (event.type === "response.failed") {
						const reason = event.response.incomplete_details?.reason;
						finishReason = {
							unified: reason ? mapXaiResponsesFinishReason(reason) : "error",
							raw: reason ?? "error"
						};
						if (event.response.usage) usage = convertXaiResponsesUsage(event.response.usage);
						if (event.response.error != null) controller.enqueue({
							type: "error",
							error: createXaiResponsesStreamError({
								message: event.response.error.message,
								code: event.response.error.code,
								eventType: event.type,
								data: event
							})
						});
						return;
					}
					if (event.type === "error") {
						controller.enqueue({
							type: "error",
							error: createXaiResponsesStreamError({
								message: event.message,
								code: event.code,
								eventType: event.type,
								data: event
							})
						});
						return;
					}
					if (event.type === "response.custom_tool_call_input.delta" || event.type === "response.custom_tool_call_input.done") return;
					if (event.type === "response.function_call_arguments.delta") {
						const toolCall = ongoingToolCalls[event.output_index];
						if (toolCall != null) controller.enqueue({
							type: "tool-input-delta",
							id: toolCall.toolCallId,
							delta: event.delta
						});
						return;
					}
					if (event.type === "response.function_call_arguments.done") return;
					if (event.type === "response.image_generation_call.in_progress" || event.type === "response.image_generation_call.generating" || event.type === "response.image_generation_call.completed") {
						if (!seenToolCalls.has(event.item_id)) {
							seenToolCalls.add(event.item_id);
							const toolName = imageGenerationToolName ?? "image_generation";
							controller.enqueue({
								type: "tool-input-start",
								id: event.item_id,
								toolName
							});
							controller.enqueue({
								type: "tool-input-delta",
								id: event.item_id,
								delta: "{}"
							});
							controller.enqueue({
								type: "tool-input-end",
								id: event.item_id
							});
							controller.enqueue({
								type: "tool-call",
								toolCallId: event.item_id,
								toolName,
								input: "{}",
								providerExecuted: true
							});
						}
						return;
					}
					if (event.type === "response.output_item.added" || event.type === "response.output_item.done") {
						const part = event.item;
						if (part.type === "reasoning") {
							if (event.type === "response.output_item.done") {
								const blockId = `reasoning-${part.id}`;
								if (!(part.id in activeReasoning)) {
									activeReasoning[part.id] = {};
									controller.enqueue({
										type: "reasoning-start",
										id: blockId,
										providerMetadata: { xai: { ...part.id && { itemId: part.id } } }
									});
								}
								controller.enqueue({
									type: "reasoning-end",
									id: blockId,
									providerMetadata: { xai: {
										...part.encrypted_content && { reasoningEncryptedContent: part.encrypted_content },
										...part.id && { itemId: part.id }
									} }
								});
								delete activeReasoning[part.id];
							}
							return;
						}
						if (part.type === "file_search_call") {
							const toolName = fileSearchToolName ?? "file_search";
							if (!seenToolCalls.has(part.id)) {
								seenToolCalls.add(part.id);
								controller.enqueue({
									type: "tool-input-start",
									id: part.id,
									toolName
								});
								controller.enqueue({
									type: "tool-input-delta",
									id: part.id,
									delta: ""
								});
								controller.enqueue({
									type: "tool-input-end",
									id: part.id
								});
								controller.enqueue({
									type: "tool-call",
									toolCallId: part.id,
									toolName,
									input: "",
									providerExecuted: true
								});
							}
							if (event.type === "response.output_item.done") controller.enqueue({
								type: "tool-result",
								toolCallId: part.id,
								toolName,
								result: {
									queries: part.queries ?? [],
									results: part.results?.map((result) => ({
										fileId: result.file_id,
										filename: result.filename,
										score: result.score,
										text: result.text
									})) ?? null
								}
							});
							return;
						}
						if (part.type === "image_generation_call") {
							const toolName = imageGenerationToolName ?? "image_generation";
							if (!seenToolCalls.has(part.id)) {
								seenToolCalls.add(part.id);
								controller.enqueue({
									type: "tool-input-start",
									id: part.id,
									toolName
								});
								controller.enqueue({
									type: "tool-input-delta",
									id: part.id,
									delta: "{}"
								});
								controller.enqueue({
									type: "tool-input-end",
									id: part.id
								});
								controller.enqueue({
									type: "tool-call",
									toolCallId: part.id,
									toolName,
									input: "{}",
									providerExecuted: true
								});
							}
							if (event.type === "response.output_item.done") {
								if (part.result != null) controller.enqueue({
									type: "tool-result",
									toolCallId: part.id,
									toolName,
									result: {
										result: part.result,
										...part.prompt != null && { prompt: part.prompt }
									}
								});
								else controller.enqueue({
									type: "tool-result",
									toolCallId: part.id,
									toolName,
									isError: true,
									result: `Image generation failed (status: ${part.status}).`
								});
							}
							return;
						}
						if (part.type === "web_search_call" || part.type === "x_search_call" || part.type === "code_interpreter_call" || part.type === "code_execution_call" || part.type === "view_image_call" || part.type === "view_x_video_call" || part.type === "custom_tool_call" || part.type === "mcp_call") {
							const webSearchSubTools = [
								"web_search",
								"web_search_with_snippets",
								"browse_page"
							];
							const xSearchSubTools = [
								"x_user_search",
								"x_keyword_search",
								"x_semantic_search",
								"x_thread_fetch"
							];
							let toolName = part.name ?? "";
							if (webSearchSubTools.includes(part.name ?? "") || part.type === "web_search_call") toolName = webSearchToolName ?? "web_search";
							else if (xSearchSubTools.includes(part.name ?? "") || part.type === "x_search_call") toolName = xSearchToolName ?? "x_search";
							else if (part.name === "code_execution" || part.type === "code_interpreter_call" || part.type === "code_execution_call") toolName = codeExecutionToolName ?? "code_execution";
							else if (part.type === "mcp_call") toolName = mcpToolName ?? part.name ?? "mcp";
							const toolInput = part.type === "custom_tool_call" ? part.input ?? "" : part.type === "mcp_call" ? part.arguments ?? "" : part.arguments ?? "";
							if ((part.type === "custom_tool_call" ? event.type === "response.output_item.done" : !seenToolCalls.has(part.id)) && !seenToolCalls.has(part.id)) {
								seenToolCalls.add(part.id);
								controller.enqueue({
									type: "tool-input-start",
									id: part.id,
									toolName
								});
								controller.enqueue({
									type: "tool-input-delta",
									id: part.id,
									delta: toolInput
								});
								controller.enqueue({
									type: "tool-input-end",
									id: part.id
								});
								controller.enqueue({
									type: "tool-call",
									toolCallId: part.id,
									toolName,
									input: toolInput,
									providerExecuted: true
								});
							}
							if (event.type === "response.output_item.done") controller.enqueue({
								type: "tool-result",
								toolCallId: part.id,
								toolName,
								result: part.type === "web_search_call" ? mapWebSearchAction(part.action) : {}
							});
							return;
						}
						if (part.type === "message") for (const contentPart of part.content) {
							if (contentPart.text && contentPart.text.length > 0) {
								const blockId = `text-${part.id}`;
								if (contentBlocks[blockId] == null) {
									contentBlocks[blockId] = { type: "text" };
									controller.enqueue({
										type: "text-start",
										id: blockId
									});
									controller.enqueue({
										type: "text-delta",
										id: blockId,
										delta: contentPart.text
									});
								}
							}
							if (contentPart.annotations) {
								for (const annotation of contentPart.annotations) if (annotation.type === "url_citation" && "url" in annotation) controller.enqueue({
									type: "source",
									sourceType: "url",
									id: self.config.generateId(),
									url: annotation.url,
									title: annotation.title ?? annotation.url
								});
							}
						}
						else if (part.type === "function_call") {
							if (event.type === "response.output_item.added") {
								ongoingToolCalls[event.output_index] = {
									toolName: part.name,
									toolCallId: part.call_id
								};
								controller.enqueue({
									type: "tool-input-start",
									id: part.call_id,
									toolName: part.name
								});
							} else if (event.type === "response.output_item.done") {
								hasFunctionCall = true;
								ongoingToolCalls[event.output_index] = void 0;
								controller.enqueue({
									type: "tool-input-end",
									id: part.call_id
								});
								controller.enqueue({
									type: "tool-call",
									toolCallId: part.call_id,
									toolName: part.name,
									input: part.arguments
								});
							}
						}
					}
				},
				flush(controller) {
					for (const [blockId, block] of Object.entries(contentBlocks)) if (block.type === "text") controller.enqueue({
						type: "text-end",
						id: blockId
					});
					controller.enqueue({
						type: "finish",
						finishReason,
						usage: usage ?? {
							inputTokens: {
								total: 0,
								noCache: 0,
								cacheRead: 0,
								cacheWrite: 0
							},
							outputTokens: {
								total: 0,
								text: 0,
								reasoning: 0
							}
						},
						...(costInUsdTicks != null || serviceTier != null || promptCacheKey != null || safetyIdentifier != null) && { providerMetadata: { xai: {
							...costInUsdTicks != null && { costInUsdTicks },
							...serviceTier != null && { serviceTier },
							...promptCacheKey != null && { promptCacheKey },
							...safetyIdentifier != null && { safetyIdentifier }
						} } }
					});
				}
			})),
			request: { body },
			response: { headers: responseHeaders }
		};
	}
};
function mapWebSearchAction(action) {
	const parsed = webSearchWireActionSchema.safeParse(action);
	if (!parsed.success) return {};
	const a = parsed.data;
	const sources = a.sources?.flatMap((s) => {
		const source = webSearchWireSourceSchema.safeParse(s);
		return source.success ? [source.data] : [];
	});
	const sourcesExtra = sources != null && sources.length > 0 ? { sources } : {};
	switch (a.type) {
		case "search": return {
			action: {
				type: "search",
				...a.query != null && { query: a.query },
				...a.queries != null && { queries: a.queries }
			},
			...sourcesExtra
		};
		case "open_page": return {
			action: {
				type: "openPage",
				url: a.url
			},
			...sourcesExtra
		};
		case "find_in_page": return {
			action: {
				type: "findInPage",
				url: a.url,
				pattern: a.pattern
			},
			...sourcesExtra
		};
	}
}
var xaiBatchEndpoint = "/v1/responses";
var xaiBatchName = "ai-sdk-text-batch";
var xaiBatchResultsPageSize = 1e3;
var xaiBatchProviderOptionsSchema = lazySchema(() => zodSchema(object({ 
/**
* TTL in seconds for the uploaded batch input file, measured from
* upload time. xAI accepts integers between 3600 (1 hour) and
* 2592000 (30 days) inclusive. Without it the file has no expiry.
*/
inputFileExpiresAfter: number().int().min(3600).max(2592e3).optional() })));
function assertSupportedBatchRequests(requests) {
	for (const request of requests) {
		const requestType = request.type;
		if (requestType !== "text" && requestType !== "image") throw new UnsupportedFunctionalityError({
			functionality: `batch request type: ${requestType}`,
			message: `The xAI Batch API does not support batch requests with type "${requestType}".`
		});
	}
}
var xaiBatchImageResponseSchema = () => object({
	data: array(object({
		url: string().nullish(),
		b64_json: string().nullish(),
		revised_prompt: string().nullish(),
		respect_moderation: boolean().nullish()
	})),
	usage: object({ cost_in_usd_ticks: number().nullish() }).nullish()
});
var xaiBatchResponseZodSchema = () => object({
	batch_id: string(),
	name: string().nullish(),
	create_time: string().nullish(),
	expire_time: string().nullish(),
	cancel_time: string().nullish(),
	cancel_by_xai_message: string().nullish(),
	state: object({
		num_requests: number().nullish(),
		num_pending: number().nullish(),
		num_success: number().nullish(),
		num_error: number().nullish(),
		num_cancelled: number().nullish()
	}).nullish()
});
var xaiBatchResponseSchema = lazySchema(() => zodSchema(xaiBatchResponseZodSchema()));
var xaiBatchErrorSchema = () => object({
	code: union([string(), number()]).nullish(),
	message: string().nullish()
});
var xaiBatchResultSchema = () => object({
	batch_request_id: string(),
	batch_result: object({
		response: object({
			chat_get_completion: unknown().nullish(),
			image_generation: unknown().nullish()
		}).nullish(),
		error: xaiBatchErrorSchema().nullish()
	}).nullish(),
	error_message: string().nullish()
});
var xaiBatchTextResponseSchema = () => object({
	id: string().nullish(),
	created: number().nullish(),
	model: string().nullish(),
	choices: array(object({
		message: object({
			role: _enum(["assistant", "tool"]),
			content: string().nullish(),
			reasoning_content: string().nullish(),
			tool_calls: array(object({
				id: string(),
				type: literal("function"),
				function: object({
					name: string(),
					arguments: string()
				})
			})).nullish()
		}),
		index: number(),
		finish_reason: string().nullish()
	})).nullish(),
	usage: object({
		prompt_tokens: number(),
		completion_tokens: number(),
		total_tokens: number(),
		cost_in_usd_ticks: number().nullish(),
		prompt_tokens_details: object({ cached_tokens: number().nullish() }).nullish(),
		completion_tokens_details: object({ reasoning_tokens: number().nullish() }).nullish()
	}).nullish(),
	citations: array(string().url()).nullish(),
	service_tier: string().nullish(),
	code: string().nullish(),
	error: string().nullish()
});
var xaiBatchResultsPageSchema = lazySchema(() => zodSchema(object({
	results: array(xaiBatchResultSchema()),
	pagination_token: string().nullish()
})));
var xaiBatchListResponseSchema = lazySchema(() => zodSchema(object({
	batches: array(xaiBatchResponseZodSchema()),
	pagination_token: string().nullish()
})));
var XaiBatch = class {
	constructor(options) {
		this.options = options;
		this.specificationVersion = "v4";
		this.supportedUrls = xaiResponsesSupportedUrls;
		this.provider = options.provider;
	}
	async doStartBatch(options) {
		assertSupportedBatchRequests(options.requests);
		const fileParts = [];
		const warnings = options.webhookUrl == null ? [] : [{ warning: {
			type: "unsupported",
			feature: "webhookUrl",
			details: "The xAI Batch API does not support per-batch webhook URLs."
		} }];
		const batchOptions = await parseProviderOptions({
			provider: "xai",
			providerOptions: options.providerOptions,
			schema: xaiBatchProviderOptionsSchema
		});
		for (const request of options.requests) {
			const preparedRequest = await this.prepareRequest(request);
			fileParts.push(JSON.stringify({
				custom_id: request.id,
				method: "POST",
				url: preparedRequest.endpoint,
				body: preparedRequest.body
			}), "\n");
			for (const warning of preparedRequest.warnings) warnings.push({
				requestId: request.id,
				warning
			});
		}
		const filename = "batch.jsonl";
		const file = new Blob(fileParts, { type: "application/jsonl" });
		fileParts.length = 0;
		const formData = new FormData();
		if (batchOptions?.inputFileExpiresAfter != null) formData.append("expires_after", String(batchOptions.inputFileExpiresAfter));
		formData.append("file", file, filename);
		const headers = combineHeaders(this.options.config.headers?.(), options.headers);
		const { value: uploadedFile } = await postFormDataToApi({
			url: this.getUrl("/files"),
			headers,
			formData,
			failedResponseHandler: xaiFailedResponseHandler,
			successfulResponseHandler: createJsonResponseHandler(xaiFilesResponseSchema),
			abortSignal: options.abortSignal,
			fetch: this.options.config.fetch
		});
		const { value: batch } = await postJsonToApi({
			url: this.getUrl("/batches"),
			headers,
			body: {
				name: xaiBatchName,
				input_file_id: uploadedFile.id
			},
			failedResponseHandler: xaiFailedResponseHandler,
			successfulResponseHandler: createJsonResponseHandler(xaiBatchResponseSchema),
			abortSignal: options.abortSignal,
			fetch: this.options.config.fetch
		});
		return {
			batchId: batch.batch_id,
			...convertXaiBatchStatus(batch),
			providerMetadata: { xai: {
				inputFileId: uploadedFile.id,
				...uploadedFile.expires_at != null ? { inputFileExpiresAt: (/* @__PURE__ */ new Date(uploadedFile.expires_at * 1e3)).toISOString() } : {}
			} },
			warnings
		};
	}
	async doGetBatchStatus(options) {
		return convertXaiBatchStatus(await this.retrieveBatch(options));
	}
	async doCancelBatch(options) {
		await postJsonToApi({
			url: this.getUrl(`/batches/${encodeURIComponent(options.batchId)}:cancel`),
			headers: combineHeaders(this.options.config.headers?.(), options.headers),
			body: {},
			failedResponseHandler: xaiFailedResponseHandler,
			successfulResponseHandler: createJsonResponseHandler(xaiBatchResponseSchema),
			abortSignal: options.abortSignal,
			fetch: this.options.config.fetch
		});
		return {};
	}
	async doListBatches(options) {
		const url = new URL(this.getUrl("/batches"));
		if (options.limit != null) url.searchParams.set("limit", String(options.limit));
		if (options.cursor != null) url.searchParams.set("pagination_token", options.cursor);
		const { value: page } = await getFromApi({
			url: url.toString(),
			headers: combineHeaders(this.options.config.headers?.(), options.headers),
			failedResponseHandler: xaiFailedResponseHandler,
			successfulResponseHandler: createJsonResponseHandler(xaiBatchListResponseSchema),
			abortSignal: options.abortSignal,
			fetch: this.options.config.fetch,
			validateUrl: false
		});
		return {
			batches: page.batches.map((batch) => ({
				batchId: batch.batch_id,
				...convertXaiBatchStatus(batch)
			})),
			...page.pagination_token != null ? { nextCursor: page.pagination_token } : {}
		};
	}
	async doGetBatchResults(options) {
		if (convertXaiBatchStatus(await this.retrieveBatch(options)).status === "pending") throw new InvalidArgumentError({
			argument: "batchId",
			message: `xAI batch "${options.batchId}" is not complete.`
		});
		return convertAsyncIteratorToReadableStream(this.iterateBatchResults(options));
	}
	async retrieveBatch(options) {
		const { value: batch } = await getFromApi({
			url: this.getUrl(`/batches/${encodeURIComponent(options.batchId)}`),
			headers: combineHeaders(this.options.config.headers?.(), options.headers),
			failedResponseHandler: xaiFailedResponseHandler,
			successfulResponseHandler: createJsonResponseHandler(xaiBatchResponseSchema),
			abortSignal: options.abortSignal,
			fetch: this.options.config.fetch,
			validateUrl: false
		});
		return batch;
	}
	async *iterateBatchResults(options) {
		let paginationToken;
		do {
			const query = new URLSearchParams({ limit: String(xaiBatchResultsPageSize) });
			if (paginationToken != null) query.set("pagination_token", paginationToken);
			const { value: page } = await getFromApi({
				url: this.getUrl(`/batches/${encodeURIComponent(options.batchId)}/results?${query}`),
				headers: combineHeaders(this.options.config.headers?.(), options.headers),
				failedResponseHandler: xaiFailedResponseHandler,
				successfulResponseHandler: createJsonResponseHandler(xaiBatchResultsPageSchema),
				abortSignal: options.abortSignal,
				fetch: this.options.config.fetch,
				validateUrl: false
			});
			for (const result of page.results) yield await this.convertBatchResult(result, options.abortSignal);
			paginationToken = page.pagination_token ?? void 0;
		} while (paginationToken != null);
	}
	async convertBatchResult(result, abortSignal) {
		const error = result.batch_result?.error;
		if ((result.error_message?.length ?? 0) > 0 || error?.code != null && error.code !== 0 && error.code !== "0" || error?.code == null && (error?.message?.length ?? 0) > 0) {
			const convertedError = convertXaiBatchError(result);
			return {
				type: "text",
				id: result.batch_request_id,
				status: isXaiCancellationError(error?.code) ? "cancelled" : "failed",
				error: convertedError
			};
		}
		const response = result.batch_result?.response;
		if (response?.chat_get_completion != null) {
			const validation = await safeValidateTypes({
				value: response.chat_get_completion,
				schema: zodSchema(xaiBatchTextResponseSchema())
			});
			if (!validation.success) return invalidXaiBatchResult(result.batch_request_id);
			const conversion = convertXaiBatchTextResponse(validation.value);
			return conversion.success ? {
				type: "text",
				id: result.batch_request_id,
				status: "succeeded",
				result: conversion.result
			} : {
				type: "text",
				id: result.batch_request_id,
				status: "failed",
				error: conversion.error
			};
		}
		if (response?.image_generation != null) {
			const validation = await safeValidateTypes({
				value: response.image_generation,
				schema: zodSchema(xaiBatchImageResponseSchema())
			});
			if (!validation.success) return invalidXaiImageBatchResult(result.batch_request_id);
			if (validation.value.data.some((image) => image.respect_moderation === false)) return {
				type: "image",
				id: result.batch_request_id,
				status: "failed",
				error: { message: "Image generation was blocked due to a content policy violation." }
			};
			const imageResult = await this.convertImageBatchResponse(validation.value, abortSignal);
			return {
				type: "image",
				id: result.batch_request_id,
				status: "succeeded",
				result: imageResult
			};
		}
		return invalidXaiBatchResult(result.batch_request_id);
	}
	async prepareRequest(request) {
		if (request.type === "text") {
			const { args: body, warnings } = await XaiResponsesLanguageModel.prepareRequest({
				modelId: request.modelId,
				options: request.options
			});
			return {
				endpoint: xaiBatchEndpoint,
				body,
				warnings
			};
		}
		const { prompt, n, size, aspectRatio, seed, files, mask, providerOptions } = request.options;
		const warnings = [];
		if (size != null) warnings.push({
			type: "unsupported",
			feature: "size",
			details: "This model does not support the `size` option. Use `aspectRatio` instead."
		});
		if (seed != null) warnings.push({
			type: "unsupported",
			feature: "seed"
		});
		if (mask != null) warnings.push({
			type: "unsupported",
			feature: "mask"
		});
		const xaiOptions = await parseProviderOptions({
			provider: "xai",
			providerOptions,
			schema: xaiImageModelOptions
		});
		const imageUrls = (files ?? []).map(convertImageModelFileToDataUri);
		const body = {
			model: request.modelId,
			prompt,
			n,
			response_format: "b64_json"
		};
		if (aspectRatio != null) body.aspect_ratio = aspectRatio;
		if (xaiOptions?.output_format != null) body.output_format = xaiOptions.output_format;
		if (xaiOptions?.sync_mode != null) body.sync_mode = xaiOptions.sync_mode;
		if (xaiOptions?.aspect_ratio != null && aspectRatio == null) body.aspect_ratio = xaiOptions.aspect_ratio;
		if (xaiOptions?.resolution != null) body.resolution = xaiOptions.resolution;
		if (xaiOptions?.quality != null) body.quality = xaiOptions.quality;
		if (xaiOptions?.user != null) body.user = xaiOptions.user;
		if (imageUrls.length === 1) body.image = {
			url: imageUrls[0],
			type: "image_url"
		};
		else if (imageUrls.length > 1) body.images = imageUrls.map((url) => ({
			url,
			type: "image_url"
		}));
		return {
			endpoint: files?.length ? "/v1/images/edits" : "/v1/images/generations",
			body,
			warnings
		};
	}
	async convertImageBatchResponse(response, abortSignal) {
		return {
			images: response.data.every((image) => image.b64_json != null) ? response.data.map((image) => image.b64_json) : await Promise.all(response.data.map(async (image) => {
				if (image.b64_json != null) return convertBase64ToUint8Array(image.b64_json);
				if (image.url == null) throw new InvalidArgumentError({
					argument: "batchResult",
					message: "xAI returned an image without data or a URL."
				});
				const { value } = await getFromApi({
					url: image.url,
					validateUrl: true,
					trustedOrigin: this.options.config.baseURL,
					abortSignal,
					failedResponseHandler: xaiFailedResponseHandler,
					successfulResponseHandler: createBinaryResponseHandler(),
					fetch: this.options.config.fetch
				});
				return value;
			})),
			warnings: [],
			response: {
				timestamp: /* @__PURE__ */ new Date(),
				modelId: "",
				headers: void 0
			},
			providerMetadata: { xai: {
				images: response.data.map((item) => item.revised_prompt != null ? { revisedPrompt: item.revised_prompt } : {}),
				...response.usage?.cost_in_usd_ticks != null ? { costInUsdTicks: response.usage.cost_in_usd_ticks } : {}
			} }
		};
	}
	getUrl(path) {
		return `${this.options.config.baseURL ?? "https://api.x.ai/v1"}${path}`;
	}
};
function convertXaiBatchStatus(batch) {
	const requestCounts = normalizeBatchRequestCounts({
		total: batch.state?.num_requests,
		pending: batch.state?.num_pending,
		completed: batch.state?.num_success,
		failed: batch.state?.num_error != null && batch.state?.num_cancelled != null ? batch.state.num_error + batch.state.num_cancelled : void 0
	});
	const isCancelled = batch.cancel_time != null || batch.cancel_by_xai_message != null;
	const isExpired = isPastDate(batch.expire_time);
	return {
		status: isCancelled || isExpired ? "failed" : requestCounts != null && requestCounts.total > 0 && requestCounts.pending === 0 ? "completed" : "pending",
		...requestCounts != null ? { requestCounts } : {},
		...isCancelled ? { error: {
			message: batch.cancel_by_xai_message ?? `xAI batch "${batch.batch_id}" was cancelled.`,
			code: "batch_cancelled"
		} } : isExpired ? { error: {
			message: `xAI batch "${batch.batch_id}" expired.`,
			code: "batch_expired"
		} } : {},
		...batch.create_time != null ? { createdAt: batch.create_time } : {},
		...batch.expire_time != null ? { expiresAt: batch.expire_time } : {}
	};
}
function isPastDate(value) {
	if (value == null) return false;
	const timestamp = Date.parse(value);
	return !Number.isNaN(timestamp) && timestamp <= Date.now();
}
function convertXaiBatchError(result) {
	const error = result.batch_result?.error;
	return {
		message: result.error_message || error?.message || "xAI batch request failed.",
		...error?.code != null && error.code !== 0 && error.code !== "0" ? { code: String(error.code) } : {}
	};
}
function isXaiCancellationError(code) {
	const normalizedCode = String(code).toLowerCase();
	return code === 1 || normalizedCode === "1" || normalizedCode === "cancelled" || normalizedCode === "batch_cancelled";
}
function invalidXaiBatchResult(id) {
	return {
		type: "text",
		id,
		status: "failed",
		error: {
			message: "xAI returned an invalid Responses batch result.",
			code: "invalid_response"
		}
	};
}
function invalidXaiImageBatchResult(id) {
	return {
		type: "image",
		id,
		status: "failed",
		error: {
			message: "xAI returned an invalid image batch result.",
			code: "invalid_response"
		}
	};
}
function convertXaiBatchTextResponse(response) {
	if (response.error != null) return {
		success: false,
		error: {
			message: response.error,
			...response.code != null ? { code: response.code } : {}
		}
	};
	const choices = response.choices;
	if (choices == null || choices.length === 0) return {
		success: false,
		error: {
			message: "xAI returned a batch response without any choices.",
			code: "invalid_response"
		}
	};
	const content = [];
	const providerExecutedToolCallIds = new Set(choices.filter((choice) => choice.message.role === "tool").flatMap((choice) => (choice.message.tool_calls ?? []).map((toolCall) => toolCall.id)));
	let lastAssistantChoice;
	for (const choice of choices) {
		if (choice.message.role === "tool") {
			if (choice.message.content != null) for (const toolCall of choice.message.tool_calls ?? []) content.push({
				type: "tool-result",
				toolCallId: toolCall.id,
				toolName: toolCall.function.name,
				result: choice.message.content,
				dynamic: true
			});
			continue;
		}
		lastAssistantChoice = choice;
		if (choice.message.content) content.push({
			type: "text",
			text: choice.message.content
		});
		if (choice.message.reasoning_content) content.push({
			type: "reasoning",
			text: choice.message.reasoning_content
		});
		for (const toolCall of choice.message.tool_calls ?? []) content.push({
			type: "tool-call",
			toolCallId: toolCall.id,
			toolName: toolCall.function.name,
			input: toolCall.function.arguments,
			...providerExecutedToolCallIds.has(toolCall.id) ? {
				providerExecuted: true,
				dynamic: true
			} : {}
		});
	}
	for (const url of response.citations ?? []) content.push({
		type: "source",
		sourceType: "url",
		id: url,
		url
	});
	return {
		success: true,
		result: {
			content,
			finishReason: {
				unified: mapXaiFinishReason(lastAssistantChoice?.finish_reason),
				raw: lastAssistantChoice?.finish_reason ?? void 0
			},
			usage: response.usage ? convertXaiBatchTextUsage(response.usage) : createNullLanguageModelUsage(),
			response: getResponseMetadata(response),
			warnings: [],
			...(response.usage?.cost_in_usd_ticks != null || response.service_tier != null) && { providerMetadata: { xai: {
				...response.usage?.cost_in_usd_ticks != null ? { costInUsdTicks: response.usage.cost_in_usd_ticks } : {},
				...response.service_tier != null ? { serviceTier: response.service_tier } : {}
			} } }
		}
	};
}
function convertXaiBatchTextUsage(usage) {
	const cacheReadTokens = usage.prompt_tokens_details?.cached_tokens ?? 0;
	const reasoningTokens = usage.completion_tokens_details?.reasoning_tokens ?? 0;
	const promptTokensIncludesCached = cacheReadTokens <= usage.prompt_tokens;
	return {
		inputTokens: {
			total: promptTokensIncludesCached ? usage.prompt_tokens : usage.prompt_tokens + cacheReadTokens,
			noCache: promptTokensIncludesCached ? usage.prompt_tokens - cacheReadTokens : usage.prompt_tokens,
			cacheRead: cacheReadTokens,
			cacheWrite: void 0
		},
		outputTokens: {
			total: usage.completion_tokens + reasoningTokens,
			text: usage.completion_tokens,
			reasoning: reasoningTokens
		},
		raw: usage
	};
}
function parseXaiRealtimeServerEvent(raw) {
	const event = raw;
	const type = event.type;
	switch (type) {
		case "session.created": return {
			type: "session-created",
			sessionId: event.session?.id,
			raw
		};
		case "session.updated": return {
			type: "session-updated",
			raw
		};
		case "conversation.created": return {
			type: "custom",
			rawType: type,
			raw
		};
		case "input_audio_buffer.speech_started": return {
			type: "speech-started",
			itemId: event.item_id,
			raw
		};
		case "input_audio_buffer.speech_stopped": return {
			type: "speech-stopped",
			itemId: event.item_id,
			raw
		};
		case "input_audio_buffer.committed": return {
			type: "audio-committed",
			itemId: event.item_id,
			previousItemId: event.previous_item_id,
			raw
		};
		case "conversation.item.added": return {
			type: "conversation-item-added",
			itemId: event.item?.id ?? event.item_id,
			item: event.item,
			raw
		};
		case "conversation.item.input_audio_transcription.completed": return {
			type: "input-transcription-completed",
			itemId: event.item_id,
			transcript: event.transcript ?? "",
			raw
		};
		case "response.created": return {
			type: "response-created",
			responseId: event.response?.id ?? event.response_id,
			raw
		};
		case "response.done": return {
			type: "response-done",
			responseId: event.response?.id ?? event.response_id,
			status: event.response?.status ?? "completed",
			raw
		};
		case "response.output_item.added": return {
			type: "output-item-added",
			responseId: event.response_id,
			itemId: event.item?.id ?? event.item_id,
			raw
		};
		case "response.output_item.done": return {
			type: "output-item-done",
			responseId: event.response_id,
			itemId: event.item?.id ?? event.item_id,
			raw
		};
		case "response.content_part.added": return {
			type: "content-part-added",
			responseId: event.response_id,
			itemId: event.item_id,
			raw
		};
		case "response.content_part.done": return {
			type: "content-part-done",
			responseId: event.response_id,
			itemId: event.item_id,
			raw
		};
		case "response.output_audio.delta": return {
			type: "audio-delta",
			responseId: event.response_id,
			itemId: event.item_id,
			delta: event.delta,
			raw
		};
		case "response.output_audio.done": return {
			type: "audio-done",
			responseId: event.response_id,
			itemId: event.item_id,
			raw
		};
		case "response.output_audio_transcript.delta": return {
			type: "audio-transcript-delta",
			responseId: event.response_id,
			itemId: event.item_id,
			delta: event.delta,
			raw
		};
		case "response.output_audio_transcript.done": return {
			type: "audio-transcript-done",
			responseId: event.response_id,
			itemId: event.item_id,
			transcript: event.transcript,
			raw
		};
		case "response.text.delta": return {
			type: "text-delta",
			responseId: event.response_id,
			itemId: event.item_id,
			delta: event.delta,
			raw
		};
		case "response.text.done": return {
			type: "text-done",
			responseId: event.response_id,
			itemId: event.item_id,
			text: event.text,
			raw
		};
		case "response.function_call_arguments.delta": return {
			type: "function-call-arguments-delta",
			responseId: event.response_id,
			itemId: event.item_id,
			callId: event.call_id,
			delta: event.delta,
			raw
		};
		case "response.function_call_arguments.done": return {
			type: "function-call-arguments-done",
			responseId: event.response_id,
			itemId: event.item_id,
			callId: event.call_id,
			name: event.name,
			arguments: event.arguments,
			raw
		};
		case "mcp_list_tools.in_progress":
		case "mcp_list_tools.completed":
		case "mcp_list_tools.failed":
		case "response.mcp_call_arguments.delta":
		case "response.mcp_call_arguments.done":
		case "response.mcp_call.in_progress":
		case "response.mcp_call.completed":
		case "response.mcp_call.failed": return {
			type: "custom",
			rawType: type,
			raw
		};
		case "error": return {
			type: "error",
			message: event.error?.message ?? event.message ?? "Unknown error",
			code: event.error?.code ?? event.code,
			raw
		};
		default: return {
			type: "custom",
			rawType: type,
			raw
		};
	}
}
function serializeXaiRealtimeClientEvent(event) {
	switch (event.type) {
		case "session-update": return {
			type: "session.update",
			session: buildXaiSessionConfig(event.config)
		};
		case "input-audio-append": return {
			type: "input_audio_buffer.append",
			audio: event.audio
		};
		case "input-audio-commit": return { type: "input_audio_buffer.commit" };
		case "input-audio-clear": return { type: "input_audio_buffer.clear" };
		case "conversation-item-create": {
			const item = event.item;
			switch (item.type) {
				case "text-message": return {
					type: "conversation.item.create",
					item: {
						type: "message",
						role: item.role,
						content: [{
							type: "input_text",
							text: item.text
						}]
					}
				};
				case "audio-message": return {
					type: "conversation.item.create",
					item: {
						type: "message",
						role: item.role,
						content: [{
							type: "input_audio",
							audio: item.audio
						}]
					}
				};
				case "function-call-output": return {
					type: "conversation.item.create",
					item: {
						type: "function_call_output",
						call_id: item.callId,
						output: item.output
					}
				};
			}
			break;
		}
		case "conversation-item-truncate": return;
		case "response-create": return {
			type: "response.create",
			...event.options != null ? { response: {
				...event.options.modalities != null ? { modalities: event.options.modalities } : {},
				...event.options.instructions != null ? { instructions: event.options.instructions } : {}
			} } : {}
		};
		case "response-cancel": return { type: "response.cancel" };
	}
}
function buildXaiSessionConfig(config) {
	const session = {};
	if (config.instructions != null) session.instructions = config.instructions;
	if (config.voice != null) session.voice = config.voice;
	const audio = {};
	if (config.inputAudioFormat != null) audio.input = { format: {
		type: config.inputAudioFormat.type,
		...config.inputAudioFormat.rate != null ? { rate: config.inputAudioFormat.rate } : {}
	} };
	if (config.outputAudioFormat != null) audio.output = { format: {
		type: config.outputAudioFormat.type,
		...config.outputAudioFormat.rate != null ? { rate: config.outputAudioFormat.rate } : {}
	} };
	if (Object.keys(audio).length > 0) session.audio = audio;
	if (config.turnDetection != null) {
		if (config.turnDetection.type === "disabled") session.turn_detection = null;
		else {
			const td = { type: "server_vad" };
			if (config.turnDetection.threshold != null) td.threshold = config.turnDetection.threshold;
			if (config.turnDetection.silenceDurationMs != null) td.silence_duration_ms = config.turnDetection.silenceDurationMs;
			if (config.turnDetection.prefixPaddingMs != null) td.prefix_padding_ms = config.turnDetection.prefixPaddingMs;
			session.turn_detection = td;
		}
	}
	if (config.tools != null && config.tools.length > 0) session.tools = config.tools.map((tool) => ({
		type: tool.type,
		name: tool.name,
		description: tool.description,
		parameters: tool.parameters
	}));
	if (config.providerOptions != null) {
		const xaiOptions = config.providerOptions;
		if (Array.isArray(xaiOptions.tools)) session.tools = [...session.tools ?? [], ...xaiOptions.tools];
		for (const [key, value] of Object.entries(xaiOptions)) if (key !== "tools") session[key] = value;
	}
	return session;
}
var XaiRealtimeModel = class {
	constructor(modelId, config) {
		this.specificationVersion = "v4";
		this.modelId = modelId;
		this.provider = config.provider;
		this.config = config;
	}
	async doCreateClientSecret(options) {
		const fetchFn = this.config.fetch ?? fetch;
		const url = `${this.config.baseURL}/realtime/client_secrets`;
		const body = {};
		if (options.expiresAfterSeconds != null) body.expires_after = { seconds: options.expiresAfterSeconds };
		const response = await fetchFn(url, {
			method: "POST",
			headers: {
				...this.config.headers(),
				"Content-Type": "application/json"
			},
			body: JSON.stringify(body)
		});
		if (!response.ok) {
			const text = await response.text();
			throw new Error(`xAI realtime client secret request failed: ${response.status} ${text}`);
		}
		const data = await response.json();
		return {
			token: data.value,
			url: `wss://${new URL(this.config.baseURL).host}/v1/realtime?model=${encodeURIComponent(this.modelId)}`,
			expiresAt: data.expires_at
		};
	}
	getWebSocketConfig(options) {
		return {
			url: options.url,
			protocols: [`xai-client-secret.${options.token}`]
		};
	}
	parseServerEvent(raw) {
		return parseXaiRealtimeServerEvent(raw);
	}
	serializeClientEvent(event) {
		return serializeXaiRealtimeClientEvent(event);
	}
	buildSessionConfig(config) {
		return buildXaiSessionConfig(config);
	}
};
var codeExecutionOutputSchema = lazySchema(() => zodSchema(object({
	output: string().describe("the output of the code execution"),
	error: string().optional().describe("any error that occurred")
})));
var codeExecutionToolFactory = createProviderExecutedToolFactory({
	id: "xai.code_execution",
	inputSchema: object({}).describe("no input parameters"),
	outputSchema: codeExecutionOutputSchema
});
var codeExecution = (args = {}) => codeExecutionToolFactory(args);
var viewImageOutputSchema = lazySchema(() => zodSchema(object({
	description: string().describe("description of the image"),
	objects: array(string()).optional().describe("objects detected in the image")
})));
var viewImageToolFactory = createProviderExecutedToolFactory({
	id: "xai.view_image",
	inputSchema: object({}).describe("no input parameters"),
	outputSchema: viewImageOutputSchema
});
var viewImage = (args = {}) => viewImageToolFactory(args);
var viewXVideoOutputSchema = lazySchema(() => zodSchema(object({
	transcript: string().optional().describe("transcript of the video"),
	description: string().describe("description of the video content"),
	duration: number().optional().describe("duration in seconds")
})));
var viewXVideoToolFactory = createProviderExecutedToolFactory({
	id: "xai.view_x_video",
	inputSchema: object({}).describe("no input parameters"),
	outputSchema: viewXVideoOutputSchema
});
var viewXVideo = (args = {}) => viewXVideoToolFactory(args);
var xaiTools = {
	codeExecution,
	fileSearch,
	imageGeneration,
	mcpServer,
	viewImage,
	viewXVideo,
	webSearch,
	xSearch
};
var VERSION = "5.0.27";
var xaiFilesOptionsSchema = lazySchema(() => zodSchema(looseObject({
	teamId: string().optional(),
	filePath: string().optional(),
	/**
	* TTL in seconds measured from upload time; xAI accepts integers
	* between 3600 (1 hour) and 2592000 (30 days) inclusive.
	* Omit to keep the file until it is deleted.
	*/
	expiresAfter: number().int().min(3600).max(2592e3).optional()
})));
var XaiFiles = class {
	get provider() {
		return this.config.provider;
	}
	constructor(config) {
		this.config = config;
		this.specificationVersion = "v4";
	}
	getFileId(file) {
		const fileId = file.xai;
		if (fileId == null || fileId.trim() === "") throw new InvalidArgumentError({
			argument: "file",
			message: "file reference is missing an 'xai' file id."
		});
		return fileId;
	}
	getHeaders(headers) {
		return combineHeaders(this.config.headers(), headers);
	}
	async uploadFile({ data, mediaType, filename, abortSignal, headers, providerOptions }) {
		let xaiOptions;
		try {
			xaiOptions = await parseProviderOptions({
				provider: "xai",
				providerOptions,
				schema: xaiFilesOptionsSchema
			});
		} catch (error) {
			if (data.type === "stream") await data.stream.cancel(error).catch(() => {});
			throw error;
		}
		const requestHeaders = this.getHeaders(headers);
		const url = `${this.config.baseURL}/files`;
		let response;
		if (data.type === "stream") {
			const parts = [];
			if (xaiOptions?.expiresAfter != null) parts.push({
				type: "field",
				name: "expires_after",
				value: String(xaiOptions.expiresAfter)
			});
			if (xaiOptions?.teamId != null) parts.push({
				type: "field",
				name: "team_id",
				value: xaiOptions.teamId
			});
			parts.push({
				type: "file",
				name: "file",
				filename,
				mediaType,
				content: data.stream
			});
			({value: response} = await postMultipartStreamToApi({
				url,
				headers: requestHeaders,
				parts,
				failedResponseHandler: xaiFailedResponseHandler,
				successfulResponseHandler: createJsonResponseHandler(xaiFilesResponseSchema),
				abortSignal,
				fetch: this.config.fetch
			}));
		} else {
			const fileBytes = convertInlineFileDataToUint8Array(data);
			const blob = new Blob([fileBytes], { type: mediaType });
			const formData = new FormData();
			if (xaiOptions?.expiresAfter != null) formData.append("expires_after", String(xaiOptions.expiresAfter));
			if (xaiOptions?.teamId != null) formData.append("team_id", xaiOptions.teamId);
			if (filename != null) formData.append("file", blob, filename);
			else formData.append("file", blob);
			({value: response} = await postFormDataToApi({
				url,
				headers: requestHeaders,
				formData,
				failedResponseHandler: xaiFailedResponseHandler,
				successfulResponseHandler: createJsonResponseHandler(xaiFilesResponseSchema),
				abortSignal,
				fetch: this.config.fetch
			}));
		}
		return {
			warnings: [],
			providerReference: { xai: response.id },
			...response.filename ?? filename ? { filename: response.filename ?? filename } : {},
			...mediaType != null ? { mediaType } : {},
			...response.bytes != null ? { byteSize: response.bytes } : {},
			...response.created_at != null ? { createdAt: /* @__PURE__ */ new Date(response.created_at * 1e3) } : {},
			...response.expires_at != null ? { expiresAt: /* @__PURE__ */ new Date(response.expires_at * 1e3) } : {},
			providerMetadata: { xai: this.toFileMetadata(response) }
		};
	}
	async getFileMetadata({ file, abortSignal, headers }) {
		const fileId = this.getFileId(file);
		const { value: response } = await getFromApi({
			url: `${this.config.baseURL}/files/${encodePathSegment(fileId)}`,
			headers: this.getHeaders(headers),
			failedResponseHandler: xaiFailedResponseHandler,
			successfulResponseHandler: createJsonResponseHandler(xaiFilesResponseSchema),
			abortSignal,
			fetch: this.config.fetch,
			validateUrl: false
		});
		return {
			warnings: [],
			providerReference: { xai: response.id },
			...response.filename != null ? { filename: response.filename } : {},
			...response.bytes != null ? { byteSize: response.bytes } : {},
			...response.created_at != null ? { createdAt: /* @__PURE__ */ new Date(response.created_at * 1e3) } : {},
			...response.expires_at != null ? { expiresAt: /* @__PURE__ */ new Date(response.expires_at * 1e3) } : {},
			providerMetadata: { xai: this.toFileMetadata(response) }
		};
	}
	async downloadFile({ file, abortSignal, headers }) {
		const fileId = this.getFileId(file);
		const { value: content, responseHeaders } = await getFromApi({
			url: `${this.config.baseURL}/files/${encodePathSegment(fileId)}/content`,
			headers: this.getHeaders(headers),
			failedResponseHandler: xaiFailedResponseHandler,
			successfulResponseHandler: createBinaryStreamResponseHandler(),
			abortSignal,
			fetch: this.config.fetch,
			validateUrl: false
		});
		const mediaType = responseHeaders?.["content-type"]?.split(";")[0].trim();
		return {
			warnings: [],
			content,
			...mediaType ? { mediaType } : {}
		};
	}
	async deleteFile({ file, abortSignal, headers }) {
		const fileId = this.getFileId(file);
		const { value: response } = await deleteFromApi({
			url: `${this.config.baseURL}/files/${encodePathSegment(fileId)}`,
			headers: this.getHeaders(headers),
			failedResponseHandler: xaiFailedResponseHandler,
			successfulResponseHandler: createJsonResponseHandler(xaiFileDeleteResponseSchema),
			abortSignal,
			fetch: this.config.fetch
		});
		return {
			warnings: [],
			providerReference: { xai: response.id },
			deleted: response.deleted
		};
	}
	toFileMetadata(response) {
		return {
			...response.filename != null ? { filename: response.filename } : {},
			...response.purpose != null ? { purpose: response.purpose } : {},
			...response.bytes != null ? { bytes: response.bytes } : {},
			...response.created_at != null ? { createdAt: response.created_at } : {},
			...response.status != null ? { status: response.status } : {},
			...response.expires_at != null ? { expiresAt: response.expires_at } : {}
		};
	}
};
var nonEmptyStringSchema = () => string().min(1);
var resolutionSchema = () => _enum([
	"480p",
	"720p",
	"1080p"
]);
var modeSchema = () => _enum([
	"edit-video",
	"extend-video",
	"reference-to-video"
]);
var keyframeSchema = () => object({
	imageUrl: nonEmptyStringSchema(),
	timestampSeconds: number().positive()
});
var storageOptionsSchema = () => object({
	filename: nonEmptyStringSchema(),
	expiresAfter: number().int().positive().max(2592e3).optional(),
	publicUrl: union([boolean(), object({ expiresAfter: number().int().min(3600).max(2592e3).optional() })]).optional()
});
var baseFields = () => ({
	pollIntervalMs: number().positive().nullish(),
	pollTimeoutMs: number().positive().nullish(),
	resolution: resolutionSchema().nullish()
});
var runtimeSchema = () => looseObject({
	mode: modeSchema().optional(),
	videoUrl: nonEmptyStringSchema().optional(),
	referenceImageUrls: array(nonEmptyStringSchema()).min(1).max(7).optional(),
	referenceVoiceIds: array(nonEmptyStringSchema()).max(3).optional(),
	keyframes: array(keyframeSchema()).max(4).optional(),
	storageOptions: storageOptionsSchema().optional(),
	user: string().optional(),
	...baseFields()
});
var xaiVideoModelOptionsSchema = lazySchema(() => zodSchema(runtimeSchema()));
var RESOLUTION_MAP = {
	"1920x1080": "1080p",
	"1280x720": "720p",
	"854x480": "480p",
	"640x480": "480p"
};
function getFirstFrameImage(options) {
	return options.frameImages?.find((frame) => frame.frameType === "first_frame")?.image;
}
function getLastFrameImage(options) {
	return options.frameImages?.find((frame) => frame.frameType === "last_frame")?.image;
}
function resolveStartImage(options) {
	return getFirstFrameImage(options) ?? options.image;
}
var isVideoFile = (file) => file.mediaType != null && getTopLevelMediaType(file.mediaType) === "video";
var isImageReference = (file) => file.mediaType == null || getTopLevelMediaType(file.mediaType) === "image";
var isAudioReference = (file) => file.mediaType != null && getTopLevelMediaType(file.mediaType) === "audio";
function fileToXaiUrl(file) {
	if (file.type === "url") return file.url;
	const base64Data = typeof file.data === "string" ? file.data : convertUint8ArrayToBase64(file.data);
	return `data:${file.mediaType};base64,${base64Data}`;
}
function resolveReferences(options, xaiOptions, warnings) {
	if (options.inputReferences != null && options.inputReferences.length > 0) {
		const imageFiles = [];
		for (const reference of options.inputReferences) {
			if (isAudioReference(reference)) continue;
			if (!isImageReference(reference)) {
				warnings.push({
					type: "unsupported",
					feature: "inputReferences",
					details: "xAI reference-to-video does not accept video references. The video reference was ignored. Use providerOptions.xai.mode \"extend-video\" to continue from a video."
				});
				continue;
			}
			imageFiles.push(reference);
		}
		return imageFiles.length > 0 ? imageFiles.map((reference) => ({ url: fileToXaiUrl(reference) })) : void 0;
	}
	if (xaiOptions?.referenceImageUrls != null && xaiOptions.referenceImageUrls.length > 0) return xaiOptions.referenceImageUrls.map((url) => ({ url }));
}
function resolveReferenceAudios(options) {
	const audioReferences = options.inputReferences?.filter(isAudioReference);
	return audioReferences != null && audioReferences.length > 0 ? audioReferences.map((reference) => ({ url: fileToXaiUrl(reference) })) : void 0;
}
function hasImageInputReference(options) {
	return options.inputReferences?.some(isImageReference) ?? false;
}
function hasAudioInputReference(options) {
	return options.inputReferences?.some(isAudioReference) ?? false;
}
function resolveVideoMode(options, xaiOptions) {
	if (xaiOptions?.mode != null) return xaiOptions.mode;
	if (xaiOptions?.videoUrl != null) return "edit-video";
	const hasLegacyReferenceUrls = xaiOptions?.referenceImageUrls != null && xaiOptions.referenceImageUrls.length > 0;
	if (hasImageInputReference(options) || hasAudioInputReference(options) || hasLegacyReferenceUrls) return "reference-to-video";
}
var XaiVideoModel = class {
	get provider() {
		return this.config.provider;
	}
	constructor(modelId, config) {
		this.modelId = modelId;
		this.config = config;
		this.specificationVersion = "v4";
		this.maxVideosPerCall = 1;
	}
	async buildRequestBody(options) {
		const warnings = [];
		const xaiOptions = await parseProviderOptions({
			provider: "xai",
			providerOptions: options.providerOptions,
			schema: xaiVideoModelOptionsSchema
		});
		const effectiveMode = resolveVideoMode(options, xaiOptions);
		const isEdit = effectiveMode === "edit-video";
		const isExtension = effectiveMode === "extend-video";
		const hasReferenceImages = effectiveMode === "reference-to-video";
		if (options.fps != null) warnings.push({
			type: "unsupported",
			feature: "fps",
			details: "xAI video models do not support custom FPS."
		});
		if (options.seed != null) warnings.push({
			type: "unsupported",
			feature: "seed",
			details: "xAI video models do not support seed."
		});
		if (options.n != null && options.n > 1) warnings.push({
			type: "unsupported",
			feature: "n",
			details: "xAI video models do not support generating multiple videos per call. Only 1 video will be generated."
		});
		if (isEdit && options.duration != null) warnings.push({
			type: "unsupported",
			feature: "duration",
			details: "xAI video editing does not support custom duration."
		});
		if (isEdit && options.aspectRatio != null) warnings.push({
			type: "unsupported",
			feature: "aspectRatio",
			details: "xAI video editing does not support custom aspect ratio."
		});
		if (isEdit && (xaiOptions?.resolution != null || options.resolution != null)) warnings.push({
			type: "unsupported",
			feature: "resolution",
			details: "xAI video editing does not support custom resolution."
		});
		if (isExtension && options.aspectRatio != null) warnings.push({
			type: "unsupported",
			feature: "aspectRatio",
			details: "xAI video extension does not support custom aspect ratio."
		});
		if (isExtension && (xaiOptions?.resolution != null || options.resolution != null)) warnings.push({
			type: "unsupported",
			feature: "resolution",
			details: "xAI video extension does not support custom resolution."
		});
		const body = {
			model: this.modelId,
			prompt: options.prompt
		};
		const allowDuration = !isEdit;
		const allowAspectRatio = !isEdit && !isExtension;
		const allowResolution = !isEdit && !isExtension;
		if (allowDuration && options.duration != null) body.duration = options.duration;
		if (allowAspectRatio && options.aspectRatio != null) body.aspect_ratio = options.aspectRatio;
		if (allowResolution && xaiOptions?.resolution != null) body.resolution = xaiOptions.resolution;
		else if (allowResolution && options.resolution != null) {
			const mapped = RESOLUTION_MAP[options.resolution];
			if (mapped != null) body.resolution = mapped;
			else warnings.push({
				type: "unsupported",
				feature: "resolution",
				details: `Unrecognized resolution "${options.resolution}". Use providerOptions.xai.resolution with "480p", "720p", or "1080p" instead.`
			});
		}
		if (options.generateAudio != null && !isEdit && !isExtension) body.generate_audio = options.generateAudio;
		else if (options.generateAudio != null) warnings.push({
			type: "unsupported",
			feature: "generateAudio",
			details: `xAI ${isEdit ? "video editing" : "video extension"} does not support generateAudio.`
		});
		if (xaiOptions?.storageOptions != null) {
			const { filename, expiresAfter, publicUrl } = xaiOptions.storageOptions;
			body.storage_options = {
				filename,
				...expiresAfter != null ? { expires_after: expiresAfter } : {},
				...publicUrl != null ? { public_url: typeof publicUrl === "boolean" ? publicUrl : { ...publicUrl.expiresAfter != null ? { expires_after: publicUrl.expiresAfter } : {} } } : {}
			};
		}
		if (xaiOptions?.keyframes != null && xaiOptions.keyframes.length > 0) {
			if (this.modelId !== "grok-imagine-video-1.5" || isEdit || isExtension) warnings.push({
				type: "unsupported",
				feature: "keyframes",
				details: this.modelId !== "grok-imagine-video-1.5" ? "xAI only supports keyframes with \"grok-imagine-video-1.5\"." : `xAI ${isEdit ? "video editing" : "video extension"} does not support keyframes.`
			});
			else body.keyframes = xaiOptions.keyframes.map((keyframe) => ({
				image: { url: keyframe.imageUrl },
				timestamp_s: keyframe.timestampSeconds
			}));
		}
		if (isEdit) body.video = { url: xaiOptions.videoUrl };
		if (isExtension) body.video = { url: xaiOptions.videoUrl };
		const startImage = resolveStartImage(options);
		if (startImage != null) {
			if (isVideoFile(startImage)) {
				const fromFrameImages = getFirstFrameImage(options) != null;
				warnings.push({
					type: "unsupported",
					feature: fromFrameImages ? "frameImages" : "image",
					details: "xAI does not accept a video as a start/frame image. The video was ignored. Use providerOptions.xai.mode \"extend-video\" to continue from a video instead."
				});
			} else body.image = { url: fileToXaiUrl(startImage) };
		}
		const lastFrameImage = getLastFrameImage(options);
		if (lastFrameImage != null) {
			if (this.modelId !== "grok-imagine-video-1.5" || isEdit || isExtension || isVideoFile(lastFrameImage)) warnings.push({
				type: "unsupported",
				feature: "frameImages",
				details: this.modelId !== "grok-imagine-video-1.5" ? "xAI only supports last_frame with \"grok-imagine-video-1.5\". The last frame was ignored." : "xAI only accepts an image last_frame for video generation. The last frame was ignored."
			});
			else body.last_frame = { url: fileToXaiUrl(lastFrameImage) };
		}
		if (hasReferenceImages) {
			const referenceImages = resolveReferences(options, xaiOptions, warnings);
			const referenceAudios = resolveReferenceAudios(options);
			if (referenceImages != null) body.reference_images = referenceImages;
			else if (referenceAudios == null) warnings.push({
				type: "unsupported",
				feature: "referenceImages",
				details: "xAI reference-to-video requires at least one image reference. The video will be generated without reference images."
			});
			const referenceVoices = (xaiOptions?.referenceVoiceIds)?.map((voiceId) => ({ voice_id: voiceId }));
			const referenceAudioInputs = [...referenceAudios ?? [], ...referenceVoices ?? []];
			if (referenceAudioInputs.length > 0) {
				if (referenceAudioInputs.length > 3) warnings.push({
					type: "unsupported",
					feature: "inputReferences",
					details: "xAI reference-to-video supports at most 3 audio references. Only the first 3 were used."
				});
				body.reference_audios = referenceAudioInputs.slice(0, 3);
			}
			if (body.resolution === "1080p") {
				warnings.push({
					type: "unsupported",
					feature: "resolution",
					details: "xAI reference-to-video is limited to 720p. The request was downgraded from 1080p to 720p."
				});
				body.resolution = "720p";
			}
		}
		if (body.resolution === "1080p" && this.modelId === "grok-imagine-video") warnings.push({
			type: "unsupported",
			feature: "resolution",
			details: "xAI model \"grok-imagine-video\" does not support 1080p. Use \"grok-imagine-video-1.5\" for 1080p, or a lower resolution. The request was sent with 1080p."
		});
		if (options.inputReferences != null && options.inputReferences.length > 0 && !hasReferenceImages) warnings.push({
			type: "unsupported",
			feature: "inputReferences",
			details: hasImageInputReference(options) || hasAudioInputReference(options) ? "xAI only supports inputReferences for reference-to-video generation. The references were ignored." : "xAI reference-to-video requires at least one image or audio reference. The references were ignored."
		});
		if (xaiOptions?.referenceVoiceIds != null && xaiOptions.referenceVoiceIds.length > 0 && !hasReferenceImages) warnings.push({
			type: "unsupported",
			feature: "referenceVoiceIds",
			details: "xAI only supports reference voices for reference-to-video generation. The reference voices were ignored."
		});
		if (!isExtension && xaiOptions?.user !== void 0) body.user = xaiOptions.user;
		if (xaiOptions != null) {
			for (const [key, value] of Object.entries(xaiOptions)) if (![
				"mode",
				"pollIntervalMs",
				"pollTimeoutMs",
				"resolution",
				"videoUrl",
				"referenceImageUrls",
				"referenceVoiceIds",
				"keyframes",
				"storageOptions",
				"user"
			].includes(key)) body[key] = value;
		}
		return {
			body,
			warnings,
			xaiOptions,
			isEdit,
			isExtension,
			hasReferenceImages,
			effectiveMode
		};
	}
	async doStart(options) {
		const currentDate = this.config._internal?.currentDate?.() ?? /* @__PURE__ */ new Date();
		const { body, warnings, isEdit, isExtension } = await this.buildRequestBody(options);
		const baseURL = this.config.baseURL ?? "https://api.x.ai/v1";
		let endpoint;
		if (isEdit) endpoint = `${baseURL}/videos/edits`;
		else if (isExtension) endpoint = `${baseURL}/videos/extensions`;
		else endpoint = `${baseURL}/videos/generations`;
		const { value: createResponse, responseHeaders } = await postJsonToApi({
			url: endpoint,
			headers: combineHeaders(this.config.headers(), options.headers),
			body,
			failedResponseHandler: xaiFailedResponseHandler,
			successfulResponseHandler: createJsonResponseHandler(xaiCreateVideoResponseSchema),
			abortSignal: options.abortSignal,
			fetch: this.config.fetch
		});
		const requestId = createResponse.request_id;
		if (!requestId) throw new AISDKError({
			name: "XAI_VIDEO_GENERATION_ERROR",
			message: `No request_id returned from xAI API.`
		});
		return {
			operation: { requestId },
			warnings,
			response: {
				timestamp: currentDate,
				modelId: this.modelId,
				headers: responseHeaders
			}
		};
	}
	async doStatus(options) {
		const currentDate = this.config._internal?.currentDate?.() ?? /* @__PURE__ */ new Date();
		const { requestId } = options.operation;
		const baseURL = this.config.baseURL ?? "https://api.x.ai/v1";
		const { value: statusResponse, responseHeaders } = await getFromApi({
			url: `${baseURL}/videos/${encodePathSegment(requestId)}`,
			validateUrl: false,
			headers: combineHeaders(this.config.headers(), options.headers),
			successfulResponseHandler: xaiVideoStatusResponseHandler,
			failedResponseHandler: xaiFailedResponseHandler,
			abortSignal: options.abortSignal,
			fetch: this.config.fetch
		});
		if (statusResponse.status === "expired") return {
			status: "error",
			error: "Video generation request expired.",
			response: {
				timestamp: currentDate,
				modelId: this.modelId,
				headers: responseHeaders
			}
		};
		if (statusResponse.status === "failed") {
			const errorDetails = statusResponse.error?.message ?? statusResponse.error?.code;
			return {
				status: "error",
				error: errorDetails != null ? `Video generation failed: ${errorDetails}` : "Video generation failed.",
				response: {
					timestamp: currentDate,
					modelId: this.modelId,
					headers: responseHeaders
				}
			};
		}
		if (statusResponse.status === "done" || statusResponse.status == null && statusResponse.video?.url) {
			const video = statusResponse.video;
			if (video?.respect_moderation === false) return {
				status: "error",
				error: "Video generation was blocked due to a content policy violation.",
				response: {
					timestamp: currentDate,
					modelId: this.modelId,
					headers: responseHeaders
				}
			};
			const videoUrl = video?.url ?? video?.file_output?.public_url ?? void 0;
			if (!videoUrl) return {
				status: "error",
				error: "Video generation completed but no video URL was returned.",
				response: {
					timestamp: currentDate,
					modelId: this.modelId,
					headers: responseHeaders
				}
			};
			return {
				status: "completed",
				videos: [{
					type: "url",
					url: videoUrl,
					mediaType: "video/mp4"
				}],
				warnings: [],
				response: {
					timestamp: currentDate,
					modelId: this.modelId,
					headers: responseHeaders
				},
				providerMetadata: { xai: {
					requestId,
					videoUrl,
					...video?.duration != null ? { duration: video.duration } : {},
					...statusResponse.usage?.cost_in_usd_ticks != null ? { costInUsdTicks: statusResponse.usage.cost_in_usd_ticks } : {},
					...statusResponse.progress != null ? { progress: statusResponse.progress } : {},
					...video?.file_output != null ? { fileOutput: {
						fileId: video.file_output.file_id,
						filename: video.file_output.filename,
						...video.file_output.expires_at != null ? { expiresAt: video.file_output.expires_at } : {},
						...video.file_output.public_url != null ? { publicUrl: video.file_output.public_url } : {},
						...video.file_output.public_url_error != null ? { publicUrlError: video.file_output.public_url_error } : {},
						...video.file_output.public_url_expires_at != null ? { publicUrlExpiresAt: video.file_output.public_url_expires_at } : {}
					} } : {},
					...video?.storage_error != null ? { storageError: video.storage_error } : {}
				} }
			};
		}
		return {
			status: "pending",
			response: {
				timestamp: currentDate,
				modelId: this.modelId,
				headers: responseHeaders
			}
		};
	}
};
var xaiCreateVideoResponseSchema = lazySchema(() => zodSchema(object({ request_id: string().nullish() })));
var xaiVideoStatusResponseSchema = lazySchema(() => zodSchema(object({
	status: string().nullish(),
	video: object({
		url: string().nullish(),
		duration: number().nullish(),
		respect_moderation: boolean().nullish(),
		file_output: object({
			file_id: string(),
			filename: string(),
			expires_at: number().nullish(),
			public_url: string().nullish(),
			public_url_error: string().nullish(),
			public_url_expires_at: number().nullish()
		}).nullish(),
		storage_error: string().nullish()
	}).nullish(),
	model: string().nullish(),
	usage: object({ cost_in_usd_ticks: number().nullish() }).nullish(),
	progress: number().nullish(),
	error: object({
		code: string().nullish(),
		message: string().nullish()
	}).nullish()
})));
var xaiVideoStatusJsonResponseHandler = createJsonResponseHandler(xaiVideoStatusResponseSchema);
var MAX_PENDING_BODY_BYTES = 1048576;
var textDecoder = new TextDecoder();
async function readPendingBody({ response, url, requestBodyValues }) {
	if (response.body == null) return "";
	const reader = response.body.getReader();
	const chunks = [];
	let totalBytes = 0;
	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			totalBytes += value.length;
			if (totalBytes > MAX_PENDING_BODY_BYTES) throw new APICallError({
				message: `xAI video status response exceeded ${MAX_PENDING_BODY_BYTES} bytes`,
				url,
				requestBodyValues,
				statusCode: response.status,
				responseHeaders: extractResponseHeaders(response)
			});
			chunks.push(value);
		}
	} finally {
		reader.releaseLock();
	}
	const merged = new Uint8Array(totalBytes);
	let offset = 0;
	for (const chunk of chunks) {
		merged.set(chunk, offset);
		offset += chunk.length;
	}
	return textDecoder.decode(merged);
}
var xaiVideoStatusResponseHandler = async (options) => {
	if (options.response.status === 202) {
		const responseHeaders = extractResponseHeaders(options.response);
		const text = await readPendingBody(options);
		if (text.trim().length === 0) return {
			responseHeaders,
			value: { status: "pending" }
		};
		const parsed = await safeParseJSON({
			text,
			schema: xaiVideoStatusResponseSchema
		});
		return {
			responseHeaders,
			value: parsed.success ? parsed.value : { status: "pending" }
		};
	}
	return xaiVideoStatusJsonResponseHandler(options);
};
var xaiSpeechModelOptionsSchema = lazySchema(() => zodSchema(object({
	/**
	* Sample rate of the generated audio in Hz.
	*/
	sampleRate: union([
		literal(8e3),
		literal(16e3),
		literal(22050),
		literal(24e3),
		literal(44100),
		literal(48e3)
	]).nullish(),
	/**
	* MP3 bit rate in bits per second. Only applies when outputFormat is mp3.
	*/
	bitRate: union([
		literal(32e3),
		literal(64e3),
		literal(96e3),
		literal(128e3),
		literal(192e3)
	]).nullish(),
	/**
	* Reduce time to first audio chunk, trading some quality for latency.
	*/
	optimizeStreamingLatency: union([
		literal(0),
		literal(1),
		literal(2)
	]).nullish(),
	/**
	* Normalize written-form text into spoken-form text before synthesis.
	*/
	textNormalization: boolean().nullish(),
	/**
	* Return character-level timing metadata alongside the audio. When
	* enabled, the response carries per-character start/end times and the
	* total duration, exposed via `providerMetadata.xai`.
	*/
	withTimestamps: boolean().nullish(),
	/**
	* Map of phrases to spoken substitutions applied before synthesis.
	* Values may be respellings (`{ 'Acme Mobile': 'Acme Mobull' }`) or IPA
	* phonetics (`{ nginx: '/ˈɛndʒɪn ˈɛks/' }`).
	*/
	replace: record(string(), string()).nullish()
})));
var XaiSpeechModel = class XaiSpeechModel {
	static [WORKFLOW_SERIALIZE](model) {
		return serializeModelOptions({
			modelId: model.modelId,
			config: model.config
		});
	}
	static [WORKFLOW_DESERIALIZE](options) {
		return new XaiSpeechModel(options.modelId, options.config);
	}
	get provider() {
		return this.config.provider;
	}
	constructor(modelId, config) {
		this.modelId = modelId;
		this.config = config;
		this.specificationVersion = "v4";
	}
	async getArgs({ text, voice = "eve", outputFormat = "mp3", instructions, speed, language = "auto", providerOptions }) {
		const warnings = [];
		const xaiOptions = await parseProviderOptions({
			provider: "xai",
			providerOptions,
			schema: xaiSpeechModelOptionsSchema
		});
		let codec = "mp3";
		if ([
			"mp3",
			"wav",
			"pcm",
			"mulaw",
			"alaw"
		].includes(outputFormat)) codec = outputFormat;
		else warnings.push({
			type: "unsupported",
			feature: "outputFormat",
			details: `Unsupported output format: ${outputFormat}. Using mp3 instead.`
		});
		if (instructions != null) warnings.push({
			type: "unsupported",
			feature: "instructions",
			details: "xAI speech models do not support the `instructions` option. Use xAI speech tags in `text` to control delivery."
		});
		const output_format = { codec };
		if (xaiOptions?.sampleRate != null) output_format.sample_rate = xaiOptions.sampleRate;
		if (xaiOptions?.bitRate != null) {
			if (codec === "mp3") output_format.bit_rate = xaiOptions.bitRate;
			else warnings.push({
				type: "unsupported",
				feature: "providerOptions",
				details: "xAI `bitRate` is supported only for mp3 output. It was ignored."
			});
		}
		return {
			requestBody: {
				text,
				voice_id: voice,
				language,
				output_format,
				speed,
				optimize_streaming_latency: xaiOptions?.optimizeStreamingLatency,
				text_normalization: xaiOptions?.textNormalization,
				with_timestamps: xaiOptions?.withTimestamps,
				replace: xaiOptions?.replace
			},
			warnings,
			withTimestamps: xaiOptions?.withTimestamps === true
		};
	}
	async doGenerate(options) {
		const currentDate = this.config._internal?.currentDate?.() ?? /* @__PURE__ */ new Date();
		const { requestBody, warnings, withTimestamps } = await this.getArgs(options);
		const { value, responseHeaders, rawValue } = await postJsonToApi({
			url: `${this.config.baseURL}/tts`,
			headers: combineHeaders(this.config.headers ? await resolve(this.config.headers) : void 0, options.headers),
			body: requestBody,
			failedResponseHandler: xaiFailedResponseHandler,
			successfulResponseHandler: withTimestamps ? createJsonResponseHandler(xaiSpeechTimestampsResponseSchema) : createBinaryResponseHandler(),
			abortSignal: options.abortSignal,
			fetch: this.config.fetch
		});
		let audio;
		let envelope;
		if (value instanceof Uint8Array) audio = value;
		else {
			envelope = value;
			audio = envelope.audio != null ? convertBase64ToUint8Array(envelope.audio) : /* @__PURE__ */ new Uint8Array(0);
		}
		const traceId = responseHeaders?.["x-trace-id"];
		return {
			audio,
			warnings,
			request: { body: JSON.stringify(requestBody) },
			response: {
				timestamp: currentDate,
				modelId: this.modelId,
				headers: responseHeaders,
				body: rawValue
			},
			providerMetadata: { xai: {
				...traceId != null ? { traceId } : {},
				...envelope?.duration != null ? { duration: envelope.duration } : {},
				...envelope?.content_type != null ? { contentType: envelope.content_type } : {},
				...envelope?.audio_timestamps != null ? { audioTimestamps: {
					graphChars: envelope.audio_timestamps.graph_chars,
					graphTimes: envelope.audio_timestamps.graph_times
				} } : {}
			} }
		};
	}
};
var xaiSpeechTimestampsResponseSchema = lazySchema(() => zodSchema(object({
	audio: string().nullish(),
	content_type: string().nullish(),
	duration: number().nullish(),
	audio_timestamps: object({
		graph_chars: array(string()),
		graph_times: array(tuple([number(), number()]))
	}).nullish()
})));
var xaiTranscriptionModelOptionsSchema = lazySchema(() => zodSchema(object({
	/**
	* Input audio encoding for raw, headerless audio: `pcm`, `mulaw`, or
	* `alaw`. Container formats such as Ogg/Opus are auto-detected, so do
	* not set this for them. `opus` is for streaming only, with one raw Opus
	* packet per chunk.
	*/
	audioFormat: _enum([
		"pcm",
		"mulaw",
		"alaw",
		"opus"
	]).nullish(),
	/**
	* Sample rate of the input audio in Hz.
	*/
	sampleRate: union([
		literal(8e3),
		literal(16e3),
		literal(22050),
		literal(24e3),
		literal(44100),
		literal(48e3)
	]).nullish(),
	/**
	* Language code used for inverse text normalization.
	*/
	language: string().nullish(),
	/**
	* Enable inverse text normalization. Requires `language`.
	*/
	format: boolean().nullish(),
	/**
	* Enable per-channel transcription for multichannel audio.
	*/
	multichannel: boolean().nullish(),
	/**
	* Number of interleaved audio channels.
	*/
	channels: number().int().min(2).max(8).nullish(),
	/**
	* Enable speaker diarization.
	*/
	diarize: boolean().nullish(),
	/**
	* Terms to bias transcription toward.
	*/
	keyterm: union([string(), array(string())]).nullish(),
	/**
	* Include filler words such as "uh" and "um" in the transcript.
	*/
	fillerWords: boolean().nullish(),
	/**
	* Voice activity detection threshold between 0 and 1. Defaults to 0.5
	* for `transcribe` and 0.08 for streaming. 0 disables the filter.
	*/
	vadThreshold: number().min(0).max(1).optional(),
	/**
	* Options for streaming speech-to-text over WebSocket.
	*/
	streaming: object({
		/**
		* Emit interim transcript results while speech is being processed.
		*/
		interimResults: boolean().optional(),
		/**
		* Silence duration in milliseconds before an utterance-final event.
		*/
		endpointing: number().int().min(0).max(5e3).optional(),
		/**
		* End-of-turn detection threshold. When set, enables Smart Turn.
		*/
		smartTurn: number().min(0).max(1).optional(),
		/**
		* Maximum silence duration in milliseconds before forcing speech_final.
		*/
		smartTurnTimeout: number().int().min(1).max(5e3).optional()
	}).optional()
})));
var XaiTranscriptionModel = class XaiTranscriptionModel {
	static [WORKFLOW_SERIALIZE](model) {
		return serializeModelOptions({
			modelId: model.modelId,
			config: model.config
		});
	}
	static [WORKFLOW_DESERIALIZE](options) {
		return new XaiTranscriptionModel(options.modelId, options.config);
	}
	get provider() {
		return this.config.provider;
	}
	constructor(modelId, config) {
		this.modelId = modelId;
		this.config = config;
		this.specificationVersion = "v4";
	}
	async getArgs({ audio, mediaType, providerOptions }) {
		const warnings = [];
		const xaiOptions = await parseProviderOptions({
			provider: "xai",
			providerOptions,
			schema: xaiTranscriptionModelOptionsSchema
		});
		const formData = new FormData();
		appendXaiSttParams(formData, {
			...getXaiSttParams(this.modelId, xaiOptions),
			audio_format: xaiOptions?.audioFormat,
			format: xaiOptions?.format
		});
		const blob = audio instanceof Uint8Array ? new Blob([audio]) : new Blob([convertBase64ToUint8Array(audio)]);
		const fileExtension = mediaTypeToExtension(mediaType);
		formData.append("file", new File([blob], "audio", { type: mediaType }), `audio.${fileExtension}`);
		return {
			formData,
			warnings
		};
	}
	async doGenerate(options) {
		const currentDate = this.config._internal?.currentDate?.() ?? /* @__PURE__ */ new Date();
		const { formData, warnings } = await this.getArgs(options);
		const { value: response, responseHeaders, rawValue: rawResponse } = await postFormDataToApi({
			url: `${this.config.baseURL ?? "https://api.x.ai/v1"}/stt`,
			headers: combineHeaders(this.config.headers?.(), options.headers),
			formData,
			failedResponseHandler: xaiFailedResponseHandler,
			successfulResponseHandler: createJsonResponseHandler(xaiTranscriptionResponseSchema),
			abortSignal: options.abortSignal,
			fetch: this.config.fetch
		});
		return {
			text: response.text,
			segments: response.words?.map((word) => ({
				text: word.text,
				startSecond: word.start,
				endSecond: word.end
			})) ?? [],
			language: response.language || void 0,
			durationInSeconds: response.duration ?? void 0,
			warnings,
			response: {
				timestamp: currentDate,
				modelId: this.modelId,
				headers: responseHeaders,
				body: rawResponse
			},
			...response.words?.some((word) => word.speaker != null) && { providerMetadata: { xai: { words: response.words } } }
		};
	}
	async doStream(options) {
		const currentDate = this.config._internal?.currentDate?.() ?? /* @__PURE__ */ new Date();
		const warnings = [];
		const xaiOptions = await parseProviderOptions({
			provider: "xai",
			providerOptions: options.providerOptions,
			schema: xaiTranscriptionModelOptionsSchema
		});
		if (xaiOptions?.multichannel === true && xaiOptions.channels == null) throw new InvalidArgumentError({
			argument: "providerOptions",
			message: "providerOptions.xai.channels is required when providerOptions.xai.multichannel is true"
		});
		if (xaiOptions?.format != null) warnings.push({
			type: "unsupported",
			feature: "providerOptions.xai.format",
			details: "xAI streaming transcription does not support format."
		});
		if (xaiOptions?.audioFormat == null && !inputAudioFormatEncodings.has(options.inputAudioFormat.type)) warnings.push({
			type: "other",
			message: `Unrecognized inputAudioFormat.type "${options.inputAudioFormat.type}"; falling back to raw PCM encoding. Use ${[...inputAudioFormatEncodings.keys()].join(", ")}, or set providerOptions.xai.audioFormat explicitly.`
		});
		const url = buildXaiStreamingTranscriptionUrl({
			baseURL: this.config.baseURL ?? "https://api.x.ai/v1",
			modelId: this.modelId,
			inputAudioFormat: options.inputAudioFormat,
			providerOptions: xaiOptions
		});
		const headers = combineHeaders(this.config.headers?.(), options.headers);
		return {
			request: { body: url.toString() },
			response: {
				timestamp: currentDate,
				modelId: this.modelId
			},
			stream: createXaiStreamingTranscriptionStream({
				webSocket: this.config.webSocket,
				url,
				headers,
				warnings,
				language: xaiOptions?.language ?? void 0,
				expectedDoneCount: xaiOptions?.multichannel === true ? xaiOptions.channels : 1,
				audio: options.audio,
				abortSignal: options.abortSignal,
				includeRawChunks: options.includeRawChunks
			})
		};
	}
};
function createXaiStreamingTranscriptionStream({ webSocket, url, headers, warnings, language, expectedDoneCount, audio, abortSignal, includeRawChunks }) {
	let finished = false;
	let cleanup = () => {};
	return new ReadableStream({
		start: (controller) => {
			const doneTexts = /* @__PURE__ */ new Map();
			const finalizedTexts = /* @__PURE__ */ new Map();
			const pendingTexts = /* @__PURE__ */ new Map();
			let doneDuration;
			let audioReader;
			let connection;
			cleanup = (closeCode) => {
				if (audioReader != null) audioReader.cancel().catch(() => {});
				else audio.cancel().catch(() => {});
				connection?.close(closeCode);
			};
			const finishWithError = (error) => {
				if (finished) return;
				finished = true;
				cleanup();
				controller.error(error);
			};
			const maybeFinish = () => {
				if (finished || doneTexts.size < expectedDoneCount) return;
				finished = true;
				const text = [...doneTexts.entries()].sort(([a], [b]) => a - b).map(([, value]) => value).join("\n");
				controller.enqueue({
					type: "finish",
					text,
					segments: [],
					language,
					durationInSeconds: doneDuration
				});
				controller.close();
				cleanup(1e3);
			};
			const sendAudio = async (socket) => {
				audioReader = audio.getReader();
				try {
					while (true) {
						const { done, value } = await audioReader.read();
						if (done || finished) break;
						socket.send(value instanceof Uint8Array ? value : convertBase64ToUint8Array(value));
						await waitForWebSocketBufferDrain(socket);
					}
				} finally {
					audioReader.releaseLock();
					audioReader = void 0;
				}
				if (!finished) socket.send(JSON.stringify({ type: "audio.done" }));
			};
			connection = connectToWebSocket({
				url,
				headers,
				webSocket,
				abortSignal,
				onAbort: finishWithError,
				onProcessingError: finishWithError,
				onMessageText: async (text) => {
					const parsed = await safeParseJSON({ text });
					if (!parsed.success) return;
					const raw = parsed.value;
					if (includeRawChunks) controller.enqueue({
						type: "raw",
						rawValue: raw
					});
					switch (raw.type) {
						case "transcript.created": {
							controller.enqueue({
								type: "stream-start",
								warnings
							});
							const socket = connection?.socket;
							if (socket == null) {
								finishWithError(/* @__PURE__ */ new Error("WebSocket is not connected."));
								break;
							}
							sendAudio(socket).catch(finishWithError);
							break;
						}
						case "transcript.partial": {
							const id = channelId(raw.channel_index);
							const channelIndex = raw.channel_index ?? 0;
							if (raw.is_final && raw.speech_final) {
								const timing = timingFromXaiEvent(raw);
								if (raw.text) finalizedTexts.set(channelIndex, [...finalizedTexts.get(channelIndex) ?? [], raw.text]);
								pendingTexts.delete(channelIndex);
								controller.enqueue({
									type: "transcript-final",
									id,
									text: raw.text ?? "",
									...timing,
									channelIndex: raw.channel_index
								});
							} else {
								pendingTexts.set(channelIndex, raw.text ?? "");
								controller.enqueue({
									type: "transcript-partial",
									id,
									text: raw.text ?? "",
									startSecond: raw.start,
									durationInSeconds: raw.duration,
									channelIndex: raw.channel_index
								});
							}
							break;
						}
						case "transcript.done": {
							const channelIndex = raw.channel_index ?? 0;
							const accumulated = [...finalizedTexts.get(channelIndex) ?? [], ...pendingTexts.get(channelIndex) ? [pendingTexts.get(channelIndex)] : []].join(" ");
							doneTexts.set(channelIndex, raw.text || accumulated);
							doneDuration = raw.duration ?? doneDuration;
							maybeFinish();
							break;
						}
						case "error": finishWithError(new Error(raw.message ?? "xAI STT error"));
					}
				},
				onSocketError: () => {
					finishWithError(/* @__PURE__ */ new Error("xAI streaming transcription error." + (webSocket == null ? " Note: the native WebSocket implementation in browsers, Node.js, Deno, and Bun cannot send the Authorization header required by xAI. Pass a header-capable WebSocket implementation (e.g. the 'ws' package) via createXai({ webSocket })." : "")));
				},
				onClose: () => {
					if (finished) return;
					finished = true;
					cleanup();
					controller.close();
				}
			});
		},
		cancel: () => {
			if (finished) return;
			finished = true;
			cleanup();
		}
	});
}
function buildXaiStreamingTranscriptionUrl({ baseURL, modelId, inputAudioFormat, providerOptions }) {
	const url = toWebSocketUrl(`${baseURL}/stt`);
	const params = getXaiSttParams(modelId, providerOptions);
	appendXaiSttParams(url.searchParams, {
		...params,
		sample_rate: params.sample_rate ?? inputAudioFormat.rate,
		encoding: providerOptions?.audioFormat ?? inputAudioFormatEncodings.get(inputAudioFormat.type) ?? "pcm",
		interim_results: providerOptions?.streaming?.interimResults,
		endpointing: providerOptions?.streaming?.endpointing,
		smart_turn: providerOptions?.streaming?.smartTurn,
		smart_turn_timeout: providerOptions?.streaming?.smartTurnTimeout
	});
	return url;
}
function getXaiSttParams(modelId, options) {
	return {
		model: modelId || void 0,
		sample_rate: options?.sampleRate,
		language: options?.language,
		multichannel: options?.multichannel,
		channels: options?.channels,
		diarize: options?.diarize,
		filler_words: options?.fillerWords,
		vad_threshold: options?.vadThreshold,
		keyterm: options?.keyterm
	};
}
function appendXaiSttParams(target, params) {
	for (const [key, value] of Object.entries(params)) for (const item of Array.isArray(value) ? value : [value]) if (item != null) target.append(key, String(item));
}
var inputAudioFormatEncodings = /* @__PURE__ */ new Map([
	["audio/pcm", "pcm"],
	["audio/pcmu", "mulaw"],
	["audio/pcma", "alaw"],
	["audio/opus", "opus"]
]);
function channelId(channelIndex) {
	return channelIndex == null ? void 0 : `channel-${channelIndex}`;
}
function timingFromXaiEvent(event) {
	return {
		...event.start != null ? { startSecond: event.start } : {},
		...event.start != null && event.duration != null ? { endSecond: event.start + event.duration } : {}
	};
}
var xaiTranscriptionResponseSchema = lazySchema(() => zodSchema(object({
	text: string(),
	language: string().nullish(),
	duration: number().nullish(),
	words: array(object({
		text: string(),
		start: number(),
		end: number(),
		speaker: number().nullish()
	})).nullish()
})));
function createXai(options = {}) {
	const baseURL = withoutTrailingSlash(options.baseURL ?? "https://api.x.ai/v1");
	const getHeaders = () => withUserAgentSuffix({
		Authorization: `Bearer ${loadApiKey({
			apiKey: options.apiKey,
			environmentVariableName: "XAI_API_KEY",
			description: "xAI API key"
		})}`,
		...options.headers
	}, `ai-sdk-xai/${VERSION}`);
	const createResponsesLanguageModel = (modelId) => {
		return new XaiResponsesLanguageModel(modelId, {
			provider: "xai.responses",
			baseURL,
			headers: getHeaders,
			generateId,
			fetch: options.fetch
		});
	};
	const createImageModel = (modelId) => {
		return new XaiImageModel(modelId, {
			provider: "xai.image",
			baseURL,
			headers: getHeaders,
			fetch: options.fetch
		});
	};
	const createVideoModel = (modelId) => {
		return new XaiVideoModel(modelId, {
			provider: "xai.video",
			baseURL,
			headers: getHeaders,
			fetch: options.fetch
		});
	};
	const createRealtimeModel = (modelId) => {
		return new XaiRealtimeModel(modelId, {
			provider: "xai.realtime",
			baseURL: baseURL ?? "https://api.x.ai/v1",
			headers: getHeaders,
			fetch: options.fetch
		});
	};
	const createSpeechModel = () => {
		return new XaiSpeechModel("", {
			provider: "xai.speech",
			baseURL,
			headers: getHeaders,
			fetch: options.fetch
		});
	};
	const createTranscriptionModel = (modelId = "") => {
		return new XaiTranscriptionModel(modelId, {
			provider: "xai.transcription",
			baseURL,
			headers: getHeaders,
			fetch: options.fetch,
			webSocket: options.webSocket
		});
	};
	const experimentalRealtimeFactory = Object.assign((modelId) => createRealtimeModel(modelId), { getToken: async (tokenOptions) => {
		const secret = await createRealtimeModel(tokenOptions.model).doCreateClientSecret({
			sessionConfig: tokenOptions.sessionConfig,
			expiresAfterSeconds: tokenOptions.expiresAfterSeconds
		});
		return {
			token: secret.token,
			url: secret.url,
			expiresAt: secret.expiresAt
		};
	} });
	const createFiles = () => new XaiFiles({
		provider: "xai.files",
		baseURL,
		headers: getHeaders,
		fetch: options.fetch
	});
	const createBatch = () => new XaiBatch({
		provider: "xai.batch",
		config: {
			provider: "xai.responses",
			baseURL,
			headers: getHeaders,
			generateId,
			fetch: options.fetch
		}
	});
	const provider = (modelId) => createResponsesLanguageModel(modelId);
	provider.specificationVersion = "v4";
	provider.languageModel = createResponsesLanguageModel;
	provider.responses = createResponsesLanguageModel;
	provider.embeddingModel = (modelId) => {
		throw new NoSuchModelError({
			modelId,
			modelType: "embeddingModel"
		});
	};
	provider.textEmbeddingModel = provider.embeddingModel;
	provider.imageModel = createImageModel;
	provider.image = createImageModel;
	provider.videoModel = createVideoModel;
	provider.video = createVideoModel;
	provider.experimental_realtime = experimentalRealtimeFactory;
	provider.speechModel = createSpeechModel;
	provider.speech = createSpeechModel;
	provider.transcriptionModel = createTranscriptionModel;
	provider.transcription = createTranscriptionModel;
	provider.files = createFiles;
	provider.experimental_batch = createBatch;
	provider.tools = xaiTools;
	return provider;
}
createXai();
//#endregion
export { createXai as t };
