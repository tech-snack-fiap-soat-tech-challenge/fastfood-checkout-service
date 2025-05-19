{{- define "fiap-fastfood.fullname" -}}
{{- printf "%s-%s" .Release.Name .Chart.Name | trunc 63 | trimSuffix "-" -}}
{{- end }}

{{- define "fiap-fastfood.name" -}}
{{- .Chart.Name -}}
{{- end }}

{{- define "fiap-fastfood.chart" -}}
{{- .Chart.Name }}-{{ .Chart.Version | replace "+" "_" }}
{{- end }}

{{- define "fiap-fastfood.labels" -}}
app.kubernetes.io/name: {{ include "fiap-fastfood.name" . }}
helm.sh/chart: {{ include "fiap-fastfood.chart" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{- define "fiap-fastfood.selectorLabels" -}}
app.kubernetes.io/name: {{ include "fiap-fastfood.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{- define "fiap-fastfood.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "fiap-fastfood.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}