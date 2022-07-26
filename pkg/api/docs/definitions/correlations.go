package definitions

import (
	"github.com/grafana/grafana/pkg/services/correlations"
)

// swagger:route POST /datasources/uid/{uid}/correlations correlations createCorrelation
//
// Add correlation.
//
// Responses:
// 200: createCorrelationResponse
// 400: badRequestError
// 401: unauthorisedError
// 403: forbiddenError
// 404: notFoundError
// 500: internalServerError

// swagger:parameters createCorrelation
type CreateCorrelationParams struct {
	// in:body
	// required:true
	Body correlations.CreateCorrelationCommand `json:"body"`
	// in:path
	// required:true
	SourceUID string `json:"uid"`
}

//swagger:response createCorrelationResponse
type CreateCorrelationResponse struct {
	// in: body
	Body correlations.CreateCorrelationResponse `json:"body"`
}

// swagger:route DELETE /datasources/uid/{uid}/correlations/{correlationUid} correlations deleteCorrelation
//
// Delete a correlation.
//
// Responses:
// 200: deleteCorrelationResponse
// 401: unauthorisedError
// 403: forbiddenError
// 404: notFoundError
// 500: internalServerError

// swagger:parameters deleteCorrelation
type DeleteCorrelationParams struct {
	// in:path
	// required:true
	DatasourceUID string `json:"uid"`
	// in:path
	// required:true
	CorrelationUID string `json:"correlationUid"`
}

//swagger:response deleteCorrelationResponse
type DeleteCorrelationResponse struct {
	// in: body
	Body correlations.DeleteCorrelationResponse `json:"body"`
}

// swagger:route PATCH /datasources/uid/{uid}/correlations/{correlationUid} correlations updateCorrelation
//
// Updates a correlation.
//
// Responses:
// 200: updateCorrelationResponse
// 400: badRequestError
// 401: unauthorisedError
// 403: forbiddenError
// 404: notFoundError
// 500: internalServerError

// swagger:parameters updateCorrelation
type UpdateCorrelationParams struct {
	// in:path
	// required:true
	DatasourceUID string `json:"uid"`
	// in:path
	// required:true
	CorrelationUID string `json:"correlationUid"`
	// in: body
	Body correlations.UpdateCorrelationCommand `json:"body"`
}

//swagger:response updateCorrelationResponse
type UpdateCorrelationResponse struct {
	// in: body
	Body correlations.UpdateCorrelationResponse `json:"body"`
}
