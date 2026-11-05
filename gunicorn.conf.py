import os
bind = '0.0.0.0:' + os.environ.get('PORT', '10000')
workers = 1
threads = 8
timeout = 90
accesslog = None
errorlog = '-'
# Never dump local config or runtime secret values to logs.
capture_output = True
